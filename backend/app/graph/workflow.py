"""LangGraph workflow for stateful multi-agent decision orchestration.
Implements conditional agent routing, agent-to-agent information flow,
and complete execution traces.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid

from langgraph.graph import StateGraph, START, END
from app.graph.state import FarmWiseGraphState
from app.agents.orchestrator import orchestrator_agent
from app.agents.farm_data import farm_data_agent
from app.agents.risk_environment import risk_environment_agent
from app.agents.nutrition import nutrition_agent
from app.agents.finance import finance_agent
from app.agents.decision import decision_agent
from app.services.llm_service import llm_service
from app.config import settings

def orchestrator_node(state: FarmWiseGraphState) -> Dict[str, Any]:
    query = state.get("query", "")
    farmer_strategy = state.get("farmer_strategy", "")
    plan_result = orchestrator_agent.plan_and_route(query, farmer_strategy)

    trace = list(state.get("execution_trace", []))
    trace.append({
        "agent": "Orchestrator Agent",
        "status": "completed",
        "summary": f"Detected intent '{plan_result['intent']}'. Selected {len(plan_result['selected_agents'])} agents. {plan_result['routing_reason']}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": {
            "selected_agents": plan_result["selected_agents"],
            "task_plan": plan_result["task_plan"]
        }
    })

    return {
        "intent": plan_result["intent"],
        "intent_summary": plan_result["intent_summary"],
        "selected_agents": plan_result["selected_agents"],
        "task_plan": plan_result["task_plan"],
        "routing_reason": plan_result["routing_reason"],
        "execution_trace": trace,
        "data_mode": settings.DATA_MODE
    }

def farm_data_node(state: FarmWiseGraphState) -> Dict[str, Any]:
    farm_id = state.get("farm_id", "demo-farm-01")
    farm_data = farm_data_agent.execute(farm_id)

    trace = list(state.get("execution_trace", []))
    trace.append({
        "agent": "Farm Data Agent",
        "status": "completed",
        "summary": f"Retrieved synthetic farm records. Analyzed 14-day production drop ({farm_data['milk_trend_percentage']}%) and water decline ({farm_data['water_trend_percentage']}%). Flagged {farm_data['flagged_animals_count']} individual animals.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": {
            "milk_drop_pct": farm_data["milk_trend_percentage"],
            "water_drop_pct": farm_data["water_trend_percentage"],
            "flagged_cows": [a["tag"] for a in farm_data.get("flagged_animals", [])]
        }
    })

    return {
        "farm_data_evidence": farm_data,
        "execution_trace": trace
    }

def risk_environment_node(state: FarmWiseGraphState) -> Dict[str, Any]:
    farm_id = state.get("farm_id", "demo-farm-01")
    risk_data = risk_environment_agent.execute(farm_id)

    trace = list(state.get("execution_trace", []))
    trace.append({
        "agent": "Livestock Risk & Environment Agent",
        "status": "completed",
        "summary": f"Calculated THI: {risk_data['calculated_thi']} ({risk_data['heat_stress_category']}). Identified critical water deficit. Issued {risk_data['veterinary_escalation_count']} mandatory veterinary escalation referrals.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": {
            "thi": risk_data["calculated_thi"],
            "heat_stress": risk_data["heat_stress_category"],
            "veterinary_escalations": [v["animal_tag"] for v in risk_data.get("veterinary_escalations", [])]
        }
    })

    return {
        "risk_environment_evidence": risk_data,
        "execution_trace": trace
    }

def nutrition_node(state: FarmWiseGraphState) -> Dict[str, Any]:
    farm_id = state.get("farm_id", "demo-farm-01")
    nutrition_data = nutrition_agent.execute(farm_id)

    trace = list(state.get("execution_trace", []))
    trace.append({
        "agent": "Nutrition Agent",
        "status": "completed",
        "summary": f"Evaluated feed ingredient prices (+{nutrition_data['concentrate_price_inflation_pct']}% inflation on 20% CP concentrate). Critiqued traditional forage substitution. Formulated balanced DORB/maize alternative with rumen buffer.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": {
            "concentrate_price_inr": nutrition_data["commercial_concentrate_price_inr_per_kg"],
            "substitute_blend": nutrition_data.get("calculated_blend_25_pct")
        }
    })

    return {
        "nutrition_evidence": nutrition_data,
        "execution_trace": trace
    }

def finance_node(state: FarmWiseGraphState) -> Dict[str, Any]:
    farm_id = state.get("farm_id", "demo-farm-01")
    budget = float(state.get("budget_inr", 5000.0))
    finance_data = finance_agent.execute(farm_id, budget_inr=budget)

    trace = list(state.get("execution_trace", []))
    trace.append({
        "agent": "Finance and Scenario Agent",
        "status": "completed",
        "summary": f"Calculated deterministic expenditures and daily operating margins across 4 candidate strategies for {finance_data['animal_count']} cows. Validated compliance against ₹{budget:.2f} daily budget.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": {
            "strategies_evaluated": [s["name"] for s in finance_data["candidate_strategies"]]
        }
    })

    return {
        "finance_evidence": finance_data,
        "candidate_strategies": finance_data["candidate_strategies"],
        "execution_trace": trace
    }

async def decision_node(state: FarmWiseGraphState) -> Dict[str, Any]:
    candidate_strats = state.get("candidate_strategies", [])
    budget = float(state.get("budget_inr", 5000.0))
    priorities = state.get("priorities", {})

    # Evaluate and rank using transparent deterministic scoring
    decision_result = decision_agent.evaluate_and_rank(
        candidate_strategies_raw=candidate_strats,
        budget_inr=budget,
        priorities=priorities
    )

    ranked_strats = decision_result["ranked_strategies"]
    winner_id = decision_result["recommended_strategy_id"]
    explanation = decision_result["explanation"]

    trace = list(state.get("execution_trace", []))
    trace.append({
        "agent": "Decision Agent",
        "status": "completed",
        "summary": f"Ranked {len(ranked_strats)} candidate strategies using multi-criteria weighted scoring. Recommended: '{explanation.winner_name}' (ID: {winner_id}). Rejection rules enforced.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": {
            "recommended_strategy_id": winner_id,
            "winner_score": ranked_strats[0].scores.weighted_total if ranked_strats else 0.0
        }
    })

    # Assemble comprehensive assumptions, missing data, and safety notes
    farm_ev = state.get("farm_data_evidence", {})
    risk_ev = state.get("risk_environment_evidence", {})
    nutr_ev = state.get("nutrition_evidence", {})

    assumptions = [
        "All calculations use deterministic arithmetic based on the synthetic Karnataka demo dairy farm records.",
        "Daily milk sales valued at ₹38.00 per litre.",
        "Daily herd feed expenditures assume a lactating herd size of 24 cows.",
        "Biological yield responses are modeled scenario assumptions, not clinically guaranteed forecasts."
    ]

    missing_data = list(farm_ev.get("missing_data_warnings", []))
    if nutr_ev.get("nutritional_limitations"):
        missing_data.extend(nutr_ev.get("nutritional_limitations", []))

    safety_notes = list(risk_ev.get("safety_recommendations", []))

    return {
        "ranked_strategies": ranked_strats,
        "recommended_strategy_id": winner_id,
        "explanation": explanation.model_dump(),
        "assumptions": assumptions,
        "missing_data": missing_data,
        "safety_notes": safety_notes,
        "execution_trace": trace
    }

# -------------------------------------------------------------
# Conditional Routing Functions
# -------------------------------------------------------------

def route_after_orchestrator(state: FarmWiseGraphState) -> str:
    selected = state.get("selected_agents", [])
    if "farm_data" in selected:
        return "farm_data"
    elif "nutrition" in selected:
        return "nutrition"
    return "finance"

def route_after_farm_data(state: FarmWiseGraphState) -> str:
    selected = state.get("selected_agents", [])
    if "risk_environment" in selected:
        return "risk_environment"
    return "nutrition"

# -------------------------------------------------------------
# LangGraph Workflow Construction
# -------------------------------------------------------------

def build_workflow() -> StateGraph:
    graph = StateGraph(FarmWiseGraphState)

    # Add Nodes
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("farm_data", farm_data_node)
    graph.add_node("risk_environment", risk_environment_node)
    graph.add_node("nutrition", nutrition_node)
    graph.add_node("finance", finance_node)
    graph.add_node("decision", decision_node)

    # Add Edges
    graph.add_edge(START, "orchestrator")
    graph.add_conditional_edges(
        "orchestrator",
        route_after_orchestrator,
        {"farm_data": "farm_data", "nutrition": "nutrition", "finance": "finance"}
    )
    graph.add_conditional_edges(
        "farm_data",
        route_after_farm_data,
        {"risk_environment": "risk_environment", "nutrition": "nutrition"}
    )
    graph.add_edge("risk_environment", "nutrition")
    graph.add_edge("nutrition", "finance")
    graph.add_edge("finance", "decision")
    graph.add_edge("decision", END)

    return graph

workflow = build_workflow()
compiled_app = workflow.compile()

async def execute_agent_workflow(
    query: str,
    farm_id: str = "demo-farm-01",
    budget_inr: float = 5000.0,
    farmer_strategy: str = "",
    priorities: Dict[str, float] = None
) -> Dict[str, Any]:
    """Executes the compiled LangGraph workflow asynchronously and returns the final state."""
    initial_state: FarmWiseGraphState = {
        "query": query,
        "farm_id": farm_id,
        "budget_inr": budget_inr,
        "farmer_strategy": farmer_strategy,
        "priorities": priorities or {
            "profitability": 0.7,
            "low_cost": 0.8,
            "animal_welfare": 1.0,
            "risk_reduction": 0.9,
            "operational_feasibility": 0.6
        },
        "execution_trace": []
    }

    final_state = await compiled_app.ainvoke(initial_state)
    return final_state
