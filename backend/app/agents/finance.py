"""Finance & Scenario Agent — deterministic cost/revenue calculations and scenario comparison."""
from __future__ import annotations

import time
from typing import Dict, Any, List, Optional

from app.services.data_service import (
    get_animals, get_production_history, get_current_feed_plan,
    get_feed_by_id, calculate_daily_feed_cost, get_feeds_data,
)
from app.tools.calculators import (
    calculate_daily_revenue, calculate_margin, calculate_substitution_cost,
    calculate_full_daily_cost, check_budget, calculate_intervention_roi,
)
from app.tools.feed_comparison import evaluate_feed_substitution


# Default milk price for Karnataka (INR/litre)
DEFAULT_MILK_PRICE = 35.0


def run(farm_id: str, query_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute the Finance Agent.

    Calculates current and alternative feed costs, revenue, margins.
    Checks budget. Provides quantitative results for the Decision Arena.
    All arithmetic uses deterministic Python functions.
    """
    start = time.time()

    animals = get_animals(farm_id)
    num_cows = len(animals)
    production = get_production_history(farm_id)
    current_milk = production[-1]["total_milk_litres"] if production else 0
    plan = get_current_feed_plan(farm_id)
    milk_price = DEFAULT_MILK_PRICE

    # Current scenario
    current_feed_cost = calculate_daily_feed_cost(farm_id)
    current_revenue = calculate_daily_revenue(current_milk, milk_price)
    current_margin_data = calculate_margin(current_revenue, current_feed_cost["total_inr"])

    # Alternative scenario: substitute primary concentrate with cheaper option
    current_concentrate = get_feed_by_id(plan["primary_concentrate"])
    all_feeds = get_feeds_data()["feeds"]

    # Find best alternative concentrate
    alternative_scenarios = []
    concentrate_alternatives = [
        f for f in all_feeds
        if f["category"] == "concentrate"
        and f["feed_id"] != plan["primary_concentrate"]
        and f["current_price_inr_per_kg"] < (current_concentrate["current_price_inr_per_kg"] if current_concentrate else 999)
    ]
    concentrate_alternatives.sort(key=lambda f: f["current_price_inr_per_kg"])

    for alt in concentrate_alternatives[:2]:
        sub_cost = calculate_substitution_cost(
            current_concentrate["current_price_inr_per_kg"],
            alt["current_price_inr_per_kg"],
            plan["concentrate_kg_per_cow"],
            50.0,  # 50% substitution
            num_cows,
        )
        alternative_scenarios.append({
            "alternative_feed": alt["name"],
            "alternative_feed_id": alt["feed_id"],
            "substitution_pct": 50.0,
            "cost_data": sub_cost,
            "daily_saving_inr": sub_cost["daily_saving_inr"],
        })

    # Cooling intervention cost estimate (fans, misting, extra water)
    cooling_cost_per_day = 800.0  # Estimated for demo
    cooling_scenario = {
        "intervention": "Cooling (fans, misting, extra water access)",
        "daily_cost_inr": cooling_cost_per_day,
        "roi_30d": calculate_intervention_roi(
            cooling_cost_per_day,
            current_milk * 0.03 * milk_price,  # Assume 3% recovery
            30,
        ),
        "assumption": "Assumes 3% milk recovery with cooling — this is an illustrative scenario assumption, not a validated prediction.",
    }

    # Budget check for various strategies
    budget = query_context.get("budget_inr", 5000) if query_context else 5000
    budget_checks = {
        "current": check_budget(current_feed_cost["total_inr"], budget),
        "with_cooling": check_budget(current_feed_cost["total_inr"] + cooling_cost_per_day, budget),
    }

    missing = []
    if not current_concentrate:
        missing.append("Current concentrate feed not found — cost calculations may be inaccurate")

    duration_ms = int((time.time() - start) * 1000)

    return {
        "agent": "finance",
        "executed": True,
        "duration_ms": duration_ms,
        "findings": {
            "num_cows": num_cows,
            "current_daily_milk_litres": current_milk,
            "milk_price_inr_per_litre": milk_price,
            "current_revenue_inr": current_revenue,
            "current_feed_cost": current_feed_cost,
            "current_margin": current_margin_data,
            "alternative_feed_scenarios": alternative_scenarios,
            "cooling_scenario": cooling_scenario,
            "budget_checks": budget_checks,
        },
        "missing_data": missing,
        "summary": _build_summary(current_margin_data, alternative_scenarios, cooling_scenario),
        "assumptions": [
            f"Milk price: ₹{milk_price}/litre",
            "Feed costs based on demo dataset prices",
            "Cooling cost is an illustrative estimate",
            "Production impact of interventions is an assumed scenario, not a validated prediction",
        ],
    }


def _build_summary(margin: Dict, alternatives: List[Dict], cooling: Dict) -> str:
    parts = [
        f"Current daily margin: ₹{margin['margin_inr']} "
        f"(revenue ₹{margin['revenue_inr']} - costs ₹{margin['total_cost_inr']})."
    ]
    if alternatives:
        best = alternatives[0]
        parts.append(
            f"Best feed substitution ({best['alternative_feed']} at 50%): "
            f"saves ₹{best['daily_saving_inr']}/day."
        )
    parts.append(
        f"Cooling intervention: additional ₹{cooling['daily_cost_inr']}/day."
    )
    return " ".join(parts)
