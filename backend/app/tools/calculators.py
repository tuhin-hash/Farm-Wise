"""Deterministic financial calculators for FarmWise.

All arithmetic is done in Python — never delegated to an LLM.
All money values are in INR. All quantities in kg or litres.
"""
from __future__ import annotations

from typing import Dict, Any, Optional


def calculate_daily_feed_cost(
    price_per_kg: float,
    kg_per_cow: float,
    num_cows: int,
) -> Dict[str, float]:
    """Calculate daily feed cost for a single ingredient."""
    per_cow = round(price_per_kg * kg_per_cow, 2)
    total = round(per_cow * num_cows, 2)
    return {"per_cow_inr": per_cow, "total_inr": total}


def calculate_substitution_cost(
    feed_a_price: float,
    feed_b_price: float,
    kg_per_cow: float,
    substitution_pct: float,
    num_cows: int,
) -> Dict[str, float]:
    """Calculate cost when substituting a percentage of feed_a with feed_b."""
    pct = substitution_pct / 100.0
    kg_a = kg_per_cow * (1 - pct)
    kg_b = kg_per_cow * pct
    cost_per_cow = round(kg_a * feed_a_price + kg_b * feed_b_price, 2)
    total = round(cost_per_cow * num_cows, 2)
    original_cost_per_cow = round(kg_per_cow * feed_a_price, 2)
    original_total = round(original_cost_per_cow * num_cows, 2)
    saving = round(original_total - total, 2)
    return {
        "original_per_cow_inr": original_cost_per_cow,
        "original_total_inr": original_total,
        "new_per_cow_inr": cost_per_cow,
        "new_total_inr": total,
        "daily_saving_inr": saving,
        "kg_feed_a": round(kg_a * num_cows, 2),
        "kg_feed_b": round(kg_b * num_cows, 2),
    }


def calculate_daily_revenue(
    milk_litres: float,
    price_per_litre: float,
) -> float:
    """Calculate daily milk revenue."""
    return round(milk_litres * price_per_litre, 2)


def calculate_margin(
    revenue_inr: float,
    feed_cost_inr: float,
    other_costs_inr: float = 0.0,
) -> Dict[str, float]:
    """Calculate daily margin = revenue - costs."""
    total_cost = round(feed_cost_inr + other_costs_inr, 2)
    margin = round(revenue_inr - total_cost, 2)
    return {
        "revenue_inr": revenue_inr,
        "feed_cost_inr": feed_cost_inr,
        "other_costs_inr": other_costs_inr,
        "total_cost_inr": total_cost,
        "margin_inr": margin,
    }


def calculate_intervention_roi(
    intervention_daily_cost_inr: float,
    expected_additional_revenue_inr: float,
    days: int = 30,
) -> Dict[str, Any]:
    """Estimate ROI of an intervention over a period."""
    total_cost = round(intervention_daily_cost_inr * days, 2)
    total_revenue = round(expected_additional_revenue_inr * days, 2)
    net = round(total_revenue - total_cost, 2)
    roi_pct = round((net / total_cost * 100), 1) if total_cost > 0 else 0.0
    return {
        "period_days": days,
        "total_intervention_cost_inr": total_cost,
        "total_additional_revenue_inr": total_revenue,
        "net_benefit_inr": net,
        "roi_pct": roi_pct,
    }


def calculate_full_daily_cost(
    concentrate_kg: float,
    concentrate_price: float,
    green_fodder_kg: float,
    green_fodder_price: float,
    dry_fodder_kg: float,
    dry_fodder_price: float,
    mineral_g: float,
    mineral_price_per_kg: float,
    num_cows: int,
    intervention_cost: float = 0.0,
) -> Dict[str, float]:
    """Calculate total daily cost including all feed components and interventions."""
    conc = concentrate_kg * concentrate_price
    green = green_fodder_kg * green_fodder_price
    dry = dry_fodder_kg * dry_fodder_price
    mineral = (mineral_g / 1000.0) * mineral_price_per_kg
    per_cow = round(conc + green + dry + mineral, 2)
    feed_total = round(per_cow * num_cows, 2)
    total = round(feed_total + intervention_cost, 2)
    return {
        "feed_per_cow_inr": per_cow,
        "feed_total_inr": feed_total,
        "intervention_cost_inr": intervention_cost,
        "total_daily_cost_inr": total,
    }


def check_budget(total_cost_inr: float, budget_inr: float) -> Dict[str, Any]:
    """Check if a cost is within the farmer's budget."""
    within = total_cost_inr <= budget_inr
    overshoot = round(total_cost_inr - budget_inr, 2) if not within else 0.0
    return {
        "within_budget": within,
        "total_cost_inr": total_cost_inr,
        "budget_inr": budget_inr,
        "overshoot_inr": overshoot,
    }
