"""Nutrition Agent — compares feed alternatives, analyzes nutritional trade-offs."""
from __future__ import annotations

import time
from typing import Dict, Any, List

from app.services.data_service import get_feeds_data, get_feed_by_id, get_current_feed_plan
from app.tools.feed_comparison import compare_feeds, find_cheaper_alternatives, calculate_blended_nutrition


def run(farm_id: str, query_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute the Nutrition Agent.

    Compares feed alternatives using the supplied dataset.
    Identifies cost-effective substitutions and nutritional trade-offs.
    Never invents nutritional values.
    """
    start = time.time()

    feeds_data = get_feeds_data()
    all_feeds = feeds_data["feeds"]
    plan = get_current_feed_plan(farm_id)

    current_concentrate = get_feed_by_id(plan["primary_concentrate"])
    if not current_concentrate:
        return {
            "agent": "nutrition",
            "executed": True,
            "duration_ms": int((time.time() - start) * 1000),
            "findings": {},
            "missing_data": ["Current concentrate feed not found in dataset"],
            "summary": "Unable to analyze — current feed not found in dataset.",
        }

    # Find cheaper alternatives in the same category
    alternatives = find_cheaper_alternatives(current_concentrate, all_feeds, same_category=True)

    # Build detailed comparisons for top alternatives
    comparisons = []
    for alt in alternatives[:3]:  # Top 3
        feed_b = alt["feed"]
        blended_50 = calculate_blended_nutrition(current_concentrate, feed_b, 50.0)
        comparisons.append({
            "feed_id": feed_b["feed_id"],
            "name": feed_b["name"],
            "price_inr_per_kg": feed_b["current_price_inr_per_kg"],
            "price_saving_per_kg": round(
                current_concentrate["current_price_inr_per_kg"] - feed_b["current_price_inr_per_kg"], 2
            ),
            "protein_pct": feed_b["nutrition_per_kg"]["crude_protein_pct"],
            "protein_difference": alt["comparison"]["protein_diff_pct"],
            "energy_mcal": feed_b["nutrition_per_kg"]["metabolizable_energy_mcal"],
            "energy_difference": alt["comparison"]["energy_diff_mcal"],
            "availability": feed_b["availability"],
            "tradeoffs": alt["comparison"]["tradeoffs"],
            "blended_50pct_nutrition": blended_50,
            "warnings": _get_feed_warnings(feed_b),
        })

    # Price change analysis
    price_alerts = []
    for f in all_feeds:
        if f["price_change_pct"] > 10:
            price_alerts.append({
                "feed": f["name"],
                "change_pct": f["price_change_pct"],
                "current_price": f["current_price_inr_per_kg"],
                "previous_price": f["previous_price_inr_per_kg"],
            })

    missing = []
    if not comparisons:
        missing.append("No cheaper alternatives found in the same category")

    duration_ms = int((time.time() - start) * 1000)

    return {
        "agent": "nutrition",
        "executed": True,
        "duration_ms": duration_ms,
        "findings": {
            "current_concentrate": {
                "name": current_concentrate["name"],
                "feed_id": current_concentrate["feed_id"],
                "price_inr_per_kg": current_concentrate["current_price_inr_per_kg"],
                "price_change_pct": current_concentrate["price_change_pct"],
                "protein_pct": current_concentrate["nutrition_per_kg"]["crude_protein_pct"],
                "energy_mcal": current_concentrate["nutrition_per_kg"]["metabolizable_energy_mcal"],
            },
            "cheaper_alternatives": comparisons,
            "alternative_count": len(comparisons),
            "price_alerts": price_alerts,
        },
        "missing_data": missing,
        "summary": _build_summary(current_concentrate, comparisons, price_alerts),
        "disclaimer": "Nutritional values are from the demo dataset. Not verified by laboratory analysis.",
    }


def _get_feed_warnings(feed: Dict) -> List[str]:
    """Generate safety/quality warnings for a feed."""
    warnings = []
    notes = feed.get("notes", "").lower()
    if "gossypol" in notes:
        warnings.append("Contains gossypol — limit inclusion rate to 20-25% of concentrate")
    if "aflatoxin" in notes:
        warnings.append("Check for aflatoxin contamination before use")
    if feed.get("availability") == "limited":
        warnings.append("Limited seasonal availability")
    if feed["nutrition_per_kg"]["crude_protein_pct"] < 15:
        warnings.append("Low protein — must supplement with a protein source")
    return warnings


def _build_summary(
    current: Dict,
    alternatives: List[Dict],
    price_alerts: List[Dict],
) -> str:
    parts = [
        f"Current concentrate: {current['name']} at ₹{current['current_price_inr_per_kg']}/kg "
        f"(price up {current['price_change_pct']}%)."
    ]
    if alternatives:
        best = alternatives[0]
        parts.append(
            f"Best alternative: {best['name']} at ₹{best['price_inr_per_kg']}/kg "
            f"(saves ₹{best['price_saving_per_kg']}/kg). "
            f"Protein: {best['protein_pct']}% (diff: {best['protein_difference']:+.1f}%)."
        )
    if price_alerts:
        names = ", ".join(a["feed"] for a in price_alerts)
        parts.append(f"Feeds with significant price increases: {names}.")
    return " ".join(parts)
