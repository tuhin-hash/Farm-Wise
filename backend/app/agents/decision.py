"""Decision Agent — generates, compares, and ranks strategies in the Decision Arena.

Produces at least 4 strategy types:
  1. Farmer's traditional approach
  2. Feed adjustment
  3. Cooling & water intervention
  4. Hybrid strategy

Uses deterministic scoring (from tools/scoring.py) and the farmer's priorities
to rank strategies transparently.
"""
from __future__ import annotations

import time
from typing import Dict, Any, List, Optional

from app.tools.scoring import rank_strategies, explain_ranking
from app.services.llm_service import llm_interpret, get_mode


def run(
    farm_id: str,
    query_context: Dict[str, Any],
    agent_results: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """Execute the Decision Agent.

    Generates candidate strategies from agent evidence, scores them,
    and returns the ranking with a transparent explanation.
    """
    start = time.time()

    budget = query_context.get("budget_inr", 5000)
    priorities = query_context.get("priorities", {})
    farmer_strategy_text = query_context.get("farmer_strategy")

    farm_data = agent_results.get("farm_data", {}).get("findings", {})
    nutrition = agent_results.get("nutrition", {}).get("findings", {})
    risk = agent_results.get("risk_environment", {}).get("findings", {})
    finance = agent_results.get("finance", {}).get("findings", {})

    current_margin = finance.get("current_margin", {}).get("margin_inr", 0)
    current_feed_cost = finance.get("current_feed_cost", {}).get("total_inr", 0)
    current_revenue = finance.get("current_revenue_inr", 0)
    num_cows = farm_data.get("animal_count", 24)

    # Generate candidate strategies
    strategies = []

    # 1. Farmer's traditional approach
    strategies.append(_farmer_strategy(farmer_strategy_text, current_feed_cost, current_revenue, farm_data))

    # 2. Feed adjustment strategy
    feed_strategy = _feed_adjustment_strategy(nutrition, finance, num_cows, current_revenue)
    if feed_strategy:
        strategies.append(feed_strategy)

    # 3. Cooling & water intervention
    cooling_strategy = _cooling_strategy(risk, finance, current_feed_cost, current_revenue)
    if cooling_strategy:
        strategies.append(cooling_strategy)

    # 4. Hybrid strategy
    hybrid = _hybrid_strategy(nutrition, risk, finance, num_cows, current_feed_cost, current_revenue)
    if hybrid:
        strategies.append(hybrid)

    # Check budget constraints
    for s in strategies:
        # If budget is lower than baseline herd feed cost (e.g. ₹5000 intervention budget for a ₹8982/day herd),
        # evaluate against additional intervention cost incurred. Otherwise compare against total daily cost.
        if current_feed_cost > 0 and budget < current_feed_cost * 0.8:
            additional_cost = max(0.0, s["estimated_daily_cost_inr"] - current_feed_cost)
            s["within_budget"] = additional_cost <= budget
        else:
            s["within_budget"] = s["estimated_daily_cost_inr"] <= budget

    # Score and rank
    priorities_dict = {
        "profitability": priorities.get("profitability", 0.5),
        "low_cost": priorities.get("low_cost", 0.5),
        "animal_welfare": priorities.get("animal_welfare", 0.5),
        "risk_reduction": priorities.get("risk_reduction", 0.5),
    }
    ranked = rank_strategies(strategies, budget, current_margin, priorities_dict)
    explanation = explain_ranking(ranked, priorities_dict)

    # Optionally enhance explanation with LLM
    llm_explanation = llm_interpret(
        f"Briefly explain this farm decision recommendation in 2-3 sentences for a farmer: {explanation}",
        fallback="",
    )
    if llm_explanation:
        explanation = f"{explanation}\n\n{llm_explanation}"

    # Find recommended strategy (highest-ranked eligible; if none eligible, top ranked)
    eligible = [s for s in ranked if not s.get("disqualified")]
    if eligible:
        recommended = eligible[0]
    elif ranked:
        recommended = ranked[0]
    else:
        recommended = None

    recommended_id = recommended["strategy_id"] if recommended else ""
    recommended_name = recommended["strategy_name"] if recommended else "None"

    # Collect all assumptions and missing data
    all_assumptions = _collect_assumptions(agent_results, strategies)
    all_missing = _collect_missing_data(agent_results)

    # Safety note
    safety_note = _build_safety_note(risk)

    duration_ms = int((time.time() - start) * 1000)

    return {
        "agent": "decision",
        "executed": True,
        "duration_ms": duration_ms,
        "strategies": strategies,
        "ranking": ranked,
        "recommended_strategy_id": recommended_id,
        "recommended_strategy_name": recommended_name,
        "explanation": explanation,
        "assumptions": all_assumptions,
        "missing_data": all_missing,
        "safety_note": safety_note,
    }


def _farmer_strategy(
    farmer_text: Optional[str],
    current_cost: float,
    current_revenue: float,
    farm_data: Dict,
) -> Dict[str, Any]:
    """Build the farmer's traditional approach strategy."""
    name = farmer_text or "Continue current management"
    # If farmer suggests reducing concentrate and increasing fodder, estimate costs
    reduced_conc_cost = current_cost * 0.85  # ~15% reduction estimate
    return {
        "strategy_id": "strategy-farmer",
        "name": "Farmer's Traditional Approach",
        "description": name,
        "type": "farmer_traditional",
        "estimated_daily_cost_inr": round(reduced_conc_cost, 2) if farmer_text else round(current_cost, 2),
        "estimated_daily_revenue_inr": round(current_revenue, 2),
        "estimated_daily_margin_inr": round(current_revenue - (reduced_conc_cost if farmer_text else current_cost), 2),
        "risk_level": "medium",
        "feasibility": "easy",
        "expected_impact": (
            "Based on the farmer's experience. Reducing concentrate may lower feed costs "
            "but could further reduce milk production if protein intake drops below requirements. "
            "Impact on production is uncertain without controlled measurement."
        ),
        "advantages": [
            "Low implementation effort — familiar approach",
            "Immediate cost reduction if concentrate is reduced",
            "Respects farmer's experience and local knowledge",
        ],
        "drawbacks": [
            "May not address underlying causes (heat stress, water issues)",
            "Protein reduction could worsen production decline",
            "No environmental intervention included",
        ],
        "evidence": [
            {"source": "farm_data", "detail": f"Current production trend: {farm_data.get('production_trend', {}).get('description', 'unknown')}"},
            {"source": "farmer_input", "detail": f"Farmer's stated approach: {name}"},
        ],
        "assumptions": [
            "Farmer's approach is based on prior experience",
            "Cost reduction estimate assumes ~15% concentrate reduction",
        ],
        "missing_information": [
            "Historical outcomes of similar approach by this farmer",
            "Exact green fodder substitution quantities",
        ],
        "requires_vet_confirmation": False,
        "requires_human_confirmation": True,
    }


def _feed_adjustment_strategy(
    nutrition: Dict,
    finance: Dict,
    num_cows: int,
    current_revenue: float,
) -> Optional[Dict[str, Any]]:
    """Build a feed adjustment strategy from nutrition agent findings."""
    alternatives = nutrition.get("cheaper_alternatives", [])
    if not alternatives:
        return None

    best = alternatives[0]
    saving = best.get("price_saving_per_kg", 0)
    concentrate_kg = 6.0  # from feed plan

    # Calculate new cost with 50% substitution
    original_price = nutrition.get("current_concentrate", {}).get("price_inr_per_kg", 45)
    new_price_per_cow = (concentrate_kg * 0.5 * original_price +
                         concentrate_kg * 0.5 * best.get("price_inr_per_kg", 30))
    # Add green fodder + dry fodder + mineral
    other_per_cow = 25 * 3.0 + 5 * 5.0 + 0.05 * 85.0  # From feed plan
    total_per_cow = new_price_per_cow + other_per_cow
    total_cost = round(total_per_cow * num_cows, 2)

    daily_saving = round(
        finance.get("current_feed_cost", {}).get("total_inr", 0) - total_cost, 2
    )

    return {
        "strategy_id": "strategy-feed",
        "name": f"Feed Adjustment: Partial {best.get('name', 'alternative')} Substitution",
        "description": (
            f"Replace 50% of {nutrition.get('current_concentrate', {}).get('name', 'current concentrate')} "
            f"with {best.get('name', 'alternative')} to reduce feed costs while maintaining adequate nutrition."
        ),
        "type": "feed_adjustment",
        "estimated_daily_cost_inr": total_cost,
        "estimated_daily_revenue_inr": round(current_revenue, 2),
        "estimated_daily_margin_inr": round(current_revenue - total_cost, 2),
        "risk_level": "low",
        "feasibility": "moderate",
        "expected_impact": (
            f"Estimated daily saving of ₹{daily_saving}. "
            f"Protein content changes by {best.get('protein_difference', 0):+.1f}%. "
            f"Production impact is uncertain — gradual transition over 7-10 days recommended."
        ),
        "advantages": [
            f"Reduces daily feed cost by approximately ₹{daily_saving}",
            f"{best.get('name', 'Alternative')} is available and locally sourced",
            "Gradual substitution minimises digestive disruption",
        ],
        "drawbacks": [
            f"Protein content {'decreases' if best.get('protein_difference', 0) < 0 else 'changes'} by {abs(best.get('protein_difference', 0))}%",
            "Transition period may temporarily affect intake",
            *best.get("warnings", []),
        ],
        "evidence": [
            {"source": "nutrition_agent", "detail": f"Price comparison: ₹{original_price}/kg vs ₹{best.get('price_inr_per_kg', 0)}/kg"},
            {"source": "nutrition_agent", "detail": f"Tradeoffs: {'; '.join(best.get('tradeoffs', []))}"},
        ],
        "assumptions": [
            "50% substitution rate",
            "Nutritional values from demo dataset",
            "7-10 day gradual transition",
        ],
        "missing_information": [
            "Actual digestibility for this specific herd",
            "Verified lab analysis of the alternative feed batch",
        ],
        "requires_vet_confirmation": False,
        "requires_human_confirmation": True,
    }


def _cooling_strategy(
    risk: Dict,
    finance: Dict,
    current_feed_cost: float,
    current_revenue: float,
) -> Optional[Dict[str, Any]]:
    """Build a cooling and water intervention strategy."""
    heat = risk.get("heat_stress", {})
    water = risk.get("water_analysis", {})

    if not heat.get("is_heat_stressed", False) and not water.get("is_declining", False):
        return None

    cooling_cost = 800.0  # daily estimate
    total_cost = round(current_feed_cost + cooling_cost, 2)

    return {
        "strategy_id": "strategy-cooling",
        "name": "Cooling & Water Intervention",
        "description": (
            "Install fans/misting in resting areas, ensure 24/7 clean water access, "
            "adjust feeding times to cooler periods. Address heat stress as a primary "
            "cause of production decline."
        ),
        "type": "cooling_water",
        "estimated_daily_cost_inr": total_cost,
        "estimated_daily_revenue_inr": round(current_revenue, 2),
        "estimated_daily_margin_inr": round(current_revenue - total_cost, 2),
        "risk_level": "low",
        "feasibility": "moderate",
        "expected_impact": (
            "Cooling interventions are well-documented for heat-stressed dairy cattle. "
            "Exact production recovery cannot be predicted without monitoring. "
            f"Current THI: {heat.get('current_thi', 'N/A')}. "
            "This addresses a likely contributing factor to production decline."
        ),
        "advantages": [
            "Directly addresses documented heat stress (high THI)",
            "Improves animal comfort and welfare",
            "May help restore water intake and appetite",
            "Well-established practice for dairy farms in hot climates",
        ],
        "drawbacks": [
            f"Additional daily cost of ₹{cooling_cost}",
            "Requires infrastructure setup (fans, water points)",
            "Production recovery amount is uncertain",
        ],
        "evidence": [
            {"source": "risk_agent", "detail": f"THI index: {heat.get('current_thi', 'N/A')} — {heat.get('severity', 'unknown')} heat stress"},
            {"source": "risk_agent", "detail": f"Water trend: {water.get('trend_pct', 0):+.1f}%"},
        ],
        "assumptions": [
            f"Cooling infrastructure cost: ₹{cooling_cost}/day (illustrative estimate)",
            "Production recovery is not guaranteed — depends on heat as primary cause",
        ],
        "missing_information": [
            "Actual infrastructure quotes for fans/misting",
            "Whether heat stress is the primary cause or a contributing factor",
        ],
        "requires_vet_confirmation": False,
        "requires_human_confirmation": True,
    }


def _hybrid_strategy(
    nutrition: Dict,
    risk: Dict,
    finance: Dict,
    num_cows: int,
    current_feed_cost: float,
    current_revenue: float,
) -> Optional[Dict[str, Any]]:
    """Build a hybrid strategy combining feed adjustment + cooling."""
    alternatives = nutrition.get("cheaper_alternatives", [])
    heat = risk.get("heat_stress", {})

    if not alternatives:
        return None

    best = alternatives[0]
    # Feed saving with 30% substitution (conservative for hybrid)
    original_price = nutrition.get("current_concentrate", {}).get("price_inr_per_kg", 45)
    new_conc_price = 0.7 * original_price + 0.3 * best.get("price_inr_per_kg", 30)
    new_conc_total = round(new_conc_price * 6.0 * num_cows, 2)
    other_feed = round((25 * 3.0 + 5 * 5.0 + 0.05 * 85.0) * num_cows, 2)
    feed_cost = round(new_conc_total + other_feed, 2)

    cooling_cost = 500.0 if heat.get("is_heat_stressed") else 0  # Reduced cooling
    total_cost = round(feed_cost + cooling_cost, 2)
    feed_saving = round(current_feed_cost - feed_cost, 2)

    return {
        "strategy_id": "strategy-hybrid",
        "name": "Hybrid: Feed Optimisation + Cooling",
        "description": (
            f"Combine a 30% feed substitution ({best.get('name', 'alternative')}) "
            f"with moderate cooling interventions. Balances cost reduction with "
            f"heat stress mitigation."
        ),
        "type": "hybrid",
        "estimated_daily_cost_inr": total_cost,
        "estimated_daily_revenue_inr": round(current_revenue, 2),
        "estimated_daily_margin_inr": round(current_revenue - total_cost, 2),
        "risk_level": "low",
        "feasibility": "moderate",
        "expected_impact": (
            f"Feed cost reduced by approximately ₹{feed_saving}/day through partial substitution. "
            f"Cooling addresses heat stress (THI: {heat.get('current_thi', 'N/A')}). "
            "Combined approach targets both financial and environmental factors. "
            "Production impact remains uncertain — monitor over 2 weeks."
        ),
        "advantages": [
            f"Feed cost saving of ~₹{feed_saving}/day",
            "Addresses heat stress — a likely production factor",
            "Balanced approach reduces multiple risk factors",
            "Conservative substitution rate (30%) limits nutritional disruption",
        ],
        "drawbacks": [
            f"Net additional cost of ₹{cooling_cost}/day for cooling",
            "More complex to implement than a single intervention",
            "Requires monitoring both feed transition and cooling effectiveness",
        ],
        "evidence": [
            {"source": "nutrition_agent", "detail": f"Feed substitution saving: ₹{feed_saving}/day"},
            {"source": "risk_agent", "detail": f"Heat stress: {heat.get('severity', 'unknown')}, THI: {heat.get('current_thi', 'N/A')}"},
            {"source": "finance_agent", "detail": f"Total daily cost: ₹{total_cost}"},
        ],
        "assumptions": [
            "30% feed substitution rate (conservative)",
            f"Cooling cost: ₹{cooling_cost}/day (reduced setup)",
            "7-10 day feed transition period",
            "Production recovery is not guaranteed",
        ],
        "missing_information": [
            "Whether multiple simultaneous changes are practical for this farm",
            "Interaction effects between feed change and cooling on production",
        ],
        "requires_vet_confirmation": bool(risk.get("veterinary_review_recommended", False)),
        "requires_human_confirmation": True,
    }


def _collect_assumptions(agent_results: Dict, strategies: List[Dict]) -> List[str]:
    """Collect all assumptions from agents and strategies."""
    assumptions = set()
    for agent_name, result in agent_results.items():
        for a in result.get("assumptions", []):
            assumptions.add(a)
    for s in strategies:
        for a in s.get("assumptions", []):
            assumptions.add(a)
    assumptions.add("All data is synthetic and for demonstration purposes")
    assumptions.add("Financial calculations use deterministic formulas, not LLM estimates")
    return sorted(assumptions)


def _collect_missing_data(agent_results: Dict) -> List[str]:
    """Collect all missing data warnings from agents."""
    missing = set()
    for agent_name, result in agent_results.items():
        for m in result.get("missing_data", []):
            missing.add(m)
    return sorted(missing)


def _build_safety_note(risk: Dict) -> str:
    """Build the safety note from risk findings."""
    if risk.get("veterinary_review_recommended"):
        return (
            "⚠️ VETERINARY REVIEW RECOMMENDED: Multiple risk factors identified. "
            "This system provides decision support, not veterinary diagnosis. "
            "Consult a qualified veterinarian before implementing health-related changes. "
            "Individually flagged animals should be examined by a professional."
        )
    return (
        "This analysis is for decision support only. It does not replace professional "
        "veterinary advice. All financial projections are estimates based on assumed "
        "scenario parameters, not validated predictions."
    )
