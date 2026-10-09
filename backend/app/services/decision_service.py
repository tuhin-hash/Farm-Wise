"""Decision Service — handles orchestration, simulation, and persistence."""
from __future__ import annotations

import uuid
import json
import datetime
from typing import Dict, Any, List, Optional

from app.models.requests import AnalyzeRequest, SimulateRequest, SaveDecisionRequest, RecordOutcomeRequest
from app.models.responses import (
    AnalyzeResponse, Strategy, StrategyScore, AgentTrace,
    SimulateResponse, ScenarioResult, SavedDecision, DecisionHistoryResponse
)
from app.graph.workflow import run_farmwise_workflow
from app.graph.state import FarmWiseState
from app.services.data_service import (
    get_farm_data, get_feeds_data, get_feed_by_id,
    get_current_feed_plan, get_animals, get_production_history
)
from app.services.llm_service import get_mode
from app.tools.calculators import (
    calculate_substitution_cost, calculate_daily_revenue,
    calculate_margin, check_budget
)
from app.tools.feed_comparison import calculate_blended_nutrition, compare_feeds
from app.db.database import get_connection


def analyze_query(request: AnalyzeRequest) -> AnalyzeResponse:
    """Run multi-agent analysis on farmer query."""
    decision_id = f"dec-{uuid.uuid4().hex[:8]}"
    
    initial_state: FarmWiseState = {
        "decision_id": decision_id,
        "query": request.query,
        "farm_id": request.farm_id,
        "budget_inr": request.budget_inr,
        "farmer_strategy": request.farmer_strategy,
        "priorities": request.priorities.model_dump(),
        "execution_trace": [],
        "agent_results": {},
        "data_mode": "synthetic_demo",
    }
    
    final_state = run_farmwise_workflow(initial_state)
    
    # Format execution trace
    traces = [
        AgentTrace(**t) for t in final_state.get("execution_trace", [])
    ]
    
    # Format strategies
    raw_strategies = final_state.get("strategies", [])
    strategies = [Strategy(**s) for s in raw_strategies]
    
    # Format scoring
    raw_scoring = final_state.get("scoring", [])
    scoring = [StrategyScore(**s) for s in raw_scoring]
    
    # Summary
    orch_summary = final_state.get("orchestrator_summary", "Completed analysis.")
    selected_agents = final_state.get("required_agents", [])
    
    # Evidence dict
    evidence = {}
    for agent_name, result in final_state.get("agent_results", {}).items():
        if isinstance(result, dict) and "findings" in result:
            evidence[agent_name] = result["findings"]
            
    return AnalyzeResponse(
        decision_id=decision_id,
        data_mode="synthetic_demo",
        analysis_summary=orch_summary,
        selected_agents=selected_agents,
        execution_trace=traces,
        evidence=evidence,
        strategies=strategies,
        scoring=scoring,
        scoring_method="Weighted multi-criteria scoring with strict budget & welfare constraints",
        recommended_strategy_id=final_state.get("recommended_strategy_id", ""),
        recommended_strategy_name=final_state.get("recommended_strategy_name", ""),
        recommendation_explanation=final_state.get("recommendation_explanation", ""),
        assumptions=final_state.get("assumptions", []),
        missing_data=final_state.get("missing_data", []),
        safety_note=final_state.get("safety_note", ""),
        data_disclaimer="Synthetic demo data for Karnataka dairy farm. Not a veterinary diagnostic.",
    )


def simulate_scenario(request: SimulateRequest) -> SimulateResponse:
    """Perform deterministic what-if scenario simulation."""
    feed_a = get_feed_by_id(request.feed_a_id)
    feed_b = get_feed_by_id(request.feed_b_id)
    
    if not feed_a:
        raise ValueError(f"Feed '{request.feed_a_id}' not found in database.")
    if not feed_b:
        raise ValueError(f"Feed '{request.feed_b_id}' not found in database.")
        
    num_cows = request.num_animals
    kg_per_cow = request.feed_quantity_kg_per_cow
    sub_pct = request.substitution_pct
    
    # Current scenario (100% Feed A)
    current_cost_cow = round(feed_a["current_price_inr_per_kg"] * kg_per_cow, 2)
    current_total_feed = round(current_cost_cow * num_cows, 2)
    current_total_cost = current_total_feed  # baseline without extra intervention
    
    current_result = ScenarioResult(
        label=f"Current: 100% {feed_a['name']}",
        feed_cost_per_cow_inr=current_cost_cow,
        total_daily_feed_cost_inr=current_total_feed,
        intervention_cost_inr=0.0,
        total_daily_cost_inr=current_total_cost,
        crude_protein_pct=feed_a["nutrition_per_kg"]["crude_protein_pct"],
        tdn_pct=feed_a["nutrition_per_kg"]["tdn_pct"],
        metabolizable_energy_mcal=feed_a["nutrition_per_kg"]["metabolizable_energy_mcal"],
    )
    
    # Alternative scenario (sub_pct replaced with Feed B)
    sub_data = calculate_substitution_cost(
        feed_a["current_price_inr_per_kg"],
        feed_b["current_price_inr_per_kg"],
        kg_per_cow,
        sub_pct,
        num_cows,
    )
    blended_nutr = calculate_blended_nutrition(feed_a, feed_b, sub_pct)
    alt_total_cost = round(sub_data["new_total_inr"] + request.intervention_cost_inr_per_day, 2)
    
    alt_result = ScenarioResult(
        label=f"Alternative: {100-sub_pct:.0f}% {feed_a['name']} + {sub_pct:.0f}% {feed_b['name']}",
        feed_cost_per_cow_inr=sub_data["new_per_cow_inr"],
        total_daily_feed_cost_inr=sub_data["new_total_inr"],
        intervention_cost_inr=request.intervention_cost_inr_per_day,
        total_daily_cost_inr=alt_total_cost,
        crude_protein_pct=blended_nutr["crude_protein_pct"],
        tdn_pct=blended_nutr["tdn_pct"],
        metabolizable_energy_mcal=blended_nutr["metabolizable_energy_mcal"],
    )
    
    cost_diff = round(alt_total_cost - current_total_cost, 2)
    cost_diff_pct = round((cost_diff / current_total_cost) * 100, 1) if current_total_cost > 0 else 0.0
    
    # Nutritional trade-offs
    comp = compare_feeds(feed_a, feed_b)
    tradeoffs = comp.get("tradeoffs", [])
    
    # Production / Margin calculation
    # Using baseline demo production of 408 L for 24 cows, scaled to requested num_animals
    est_litres = round((408.0 / 24.0) * num_cows, 1)
    revenue = calculate_daily_revenue(est_litres, request.milk_price_inr_per_litre)
    
    margin_curr = round(revenue - current_total_cost, 2)
    margin_alt = round(revenue - alt_total_cost, 2)
    margin_diff = round(margin_alt - margin_curr, 2)
    
    # Budget evaluation
    budget_check = check_budget(alt_total_cost, request.budget_inr)
    
    # Risk notes & caveats
    risk_notes = []
    if sub_pct > 40 and "cottonseed" in feed_b["feed_id"]:
        risk_notes.append("Cottonseed meal contains gossypol: limiting to <= 25-30% inclusion is recommended.")
    if blended_nutr["crude_protein_pct"] < feed_a["nutrition_per_kg"]["crude_protein_pct"] - 3.0:
        risk_notes.append("Noticeable drop in crude protein (>3%). Ensure total ration protein meets lactation demand.")
    if request.intervention_cost_inr_per_day > 0:
        risk_notes.append(f"Includes ₹{request.intervention_cost_inr_per_day}/day operational intervention cost.")
        
    assumptions = [
        f"Synthetic herd estimate: {est_litres} L milk/day @ ₹{request.milk_price_inr_per_litre}/L",
        "Deterministic feed cost computation based on provided ingredient prices",
        "Assumes equal feed intake dry matter across both scenarios",
        "Biological milk response is not guaranteed and requires progressive dietary adaptation (7-10 days)",
    ]
    
    limitations = [
        "Does not account for individual animal metabolic variation or micro-mineral interactions",
        "Market prices fluctuate; check local dealer quotes before bulk purchasing",
    ]
    
    return SimulateResponse(
        data_mode="synthetic_demo",
        current_scenario=current_result,
        alternative_scenario=alt_result,
        cost_difference_inr=cost_diff,
        cost_difference_pct=cost_diff_pct,
        nutritional_tradeoffs=tradeoffs,
        margin_current_inr=margin_curr,
        margin_alternative_inr=margin_alt,
        margin_difference_inr=margin_diff,
        within_budget=budget_check["within_budget"],
        risk_notes=risk_notes,
        assumptions=assumptions,
        limitations=limitations,
    )


# ---------------------------------------------------------
# Decision Persistence
# ---------------------------------------------------------

def save_decision(request: SaveDecisionRequest) -> SavedDecision:
    """Save a farmer decision to SQLite."""
    now_str = datetime.datetime.utcnow().isoformat()
    full_resp_json = json.dumps(request.full_response) if request.full_response else ""
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO decisions (
                decision_id, query, farm_id, selected_strategy_id,
                selected_strategy_name, analysis_summary, full_response,
                farmer_notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.decision_id,
            request.query,
            request.farm_id,
            request.selected_strategy_id,
            request.selected_strategy_name,
            request.analysis_summary,
            full_resp_json,
            request.farmer_notes,
            now_str,
        ))
        
    return SavedDecision(
        decision_id=request.decision_id,
        query=request.query,
        farm_id=request.farm_id,
        selected_strategy_id=request.selected_strategy_id,
        selected_strategy_name=request.selected_strategy_name,
        analysis_summary=request.analysis_summary,
        farmer_notes=request.farmer_notes,
        created_at=now_str,
        outcome=None,
    )


def record_outcome(decision_id: str, request: RecordOutcomeRequest) -> Dict[str, Any]:
    """Record actual observed outcome for a decision."""
    now_str = datetime.datetime.utcnow().isoformat()
    
    with get_connection() as conn:
        cursor = conn.cursor()
        # Ensure decision exists
        cursor.execute("SELECT decision_id FROM decisions WHERE decision_id = ?", (decision_id,))
        row = cursor.fetchone()
        if not row:
            raise KeyError(f"Decision '{decision_id}' not found.")
            
        cursor.execute("""
            INSERT INTO outcomes (
                decision_id, actual_result, milk_change_litres,
                cost_change_inr, satisfaction, notes, recorded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            decision_id,
            request.actual_result,
            request.milk_change_litres,
            request.cost_change_inr,
            request.satisfaction,
            request.notes,
            now_str,
        ))
        
    return {
        "status": "success",
        "decision_id": decision_id,
        "actual_result": request.actual_result,
        "recorded_at": now_str,
        "message": "Outcome recorded. Note: FarmWise does not claim automatic learning from a single observation.",
    }


def list_decisions(farm_id: Optional[str] = None) -> DecisionHistoryResponse:
    """Retrieve decision history from SQLite."""
    results: List[SavedDecision] = []
    
    with get_connection() as conn:
        cursor = conn.cursor()
        if farm_id:
            cursor.execute("SELECT * FROM decisions WHERE farm_id = ? ORDER BY created_at DESC", (farm_id,))
        else:
            cursor.execute("SELECT * FROM decisions ORDER BY created_at DESC")
        rows = cursor.fetchall()
        
        for r in rows:
            dec_id = r["decision_id"]
            cursor.execute("SELECT * FROM outcomes WHERE decision_id = ? ORDER BY recorded_at DESC LIMIT 1", (dec_id,))
            outcome_row = cursor.fetchone()
            outcome_dict = None
            if outcome_row:
                outcome_dict = {
                    "actual_result": outcome_row["actual_result"],
                    "milk_change_litres": outcome_row["milk_change_litres"],
                    "cost_change_inr": outcome_row["cost_change_inr"],
                    "satisfaction": outcome_row["satisfaction"],
                    "notes": outcome_row["notes"],
                    "recorded_at": outcome_row["recorded_at"],
                }
                
            results.append(SavedDecision(
                decision_id=r["decision_id"],
                query=r["query"],
                farm_id=r["farm_id"],
                selected_strategy_id=r["selected_strategy_id"],
                selected_strategy_name=r["selected_strategy_name"],
                analysis_summary=r["analysis_summary"],
                farmer_notes=r["farmer_notes"],
                created_at=r["created_at"],
                outcome=outcome_dict,
            ))
            
    return DecisionHistoryResponse(decisions=results, total=len(results))
