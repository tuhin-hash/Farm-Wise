"""Farm Data Agent — retrieves and analyzes farm records, production trends, and animal data."""
from __future__ import annotations

import time
from typing import Dict, Any, List

from app.services.data_service import (
    get_farm_data, get_animals, get_animals_with_flags,
    get_production_history, get_production_trend,
    get_water_consumption, get_water_trend, get_alerts,
    get_current_feed_plan, calculate_daily_feed_cost,
)


def run(farm_id: str, query_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute the Farm Data Agent.

    Retrieves relevant farm records, analyzes production/water trends,
    identifies flagged animals, and returns structured evidence.
    """
    start = time.time()

    farm = get_farm_data(farm_id)
    animals = get_animals(farm_id)
    flagged = get_animals_with_flags(farm_id)
    prod_trend = get_production_trend(farm_id)
    water_trend = get_water_trend(farm_id)
    alerts = get_alerts(farm_id)
    feed_cost = calculate_daily_feed_cost(farm_id)
    production = get_production_history(farm_id)

    # Current production
    current_milk = production[-1]["total_milk_litres"] if production else 0
    avg_per_cow = production[-1]["avg_per_cow"] if production else 0

    # Identify herd-wide vs individual patterns
    individual_issues = []
    for a in flagged:
        milk_decline = round(
            ((a["avg_daily_milk_litres"] - a["current_daily_milk_litres"])
             / a["avg_daily_milk_litres"]) * 100, 1
        ) if a["avg_daily_milk_litres"] > 0 else 0
        individual_issues.append({
            "animal_id": a["animal_id"],
            "name": a["name"],
            "flag": a["health_flag"],
            "milk_decline_pct": milk_decline,
            "notes": a.get("notes", ""),
        })

    herd_wide = abs(prod_trend["trend_pct"]) > 3  # > 3% = herd-wide pattern

    # Missing data warnings
    missing = []
    if len(production) < 7:
        missing.append("Less than 7 days of production history — trend may be unreliable")
    if not flagged:
        missing.append("No individual animal flags recorded — individual health status unknown")

    duration_ms = int((time.time() - start) * 1000)

    return {
        "agent": "farm_data",
        "executed": True,
        "duration_ms": duration_ms,
        "findings": {
            "farm_id": farm_id,
            "farm_name": farm["farm"]["name"],
            "location": farm["farm"]["location"],
            "animal_count": len(animals),
            "current_daily_milk_litres": current_milk,
            "avg_per_cow_litres": avg_per_cow,
            "production_trend": prod_trend,
            "water_trend": water_trend,
            "is_herd_wide_pattern": herd_wide,
            "flagged_animals": individual_issues,
            "flagged_count": len(individual_issues),
            "daily_feed_cost": feed_cost,
            "active_alerts": [a["message"] for a in alerts],
            "alert_count": len(alerts),
        },
        "missing_data": missing,
        "summary": _build_summary(current_milk, prod_trend, water_trend, individual_issues, herd_wide),
    }


def _build_summary(
    current_milk: float,
    prod_trend: Dict,
    water_trend: Dict,
    flagged: List[Dict],
    herd_wide: bool,
) -> str:
    parts = [f"Current daily production: {current_milk} litres."]
    parts.append(
        f"Production trend: {prod_trend['description']} "
        f"({prod_trend['trend_pct']:+.1f}% over {prod_trend.get('period_days', '?')} days)."
    )
    if water_trend.get("trend_pct", 0) < -5:
        parts.append(f"Water consumption declining ({water_trend['trend_pct']:+.1f}%).")
    if herd_wide:
        parts.append("Pattern appears herd-wide, not limited to individual animals.")
    if flagged:
        names = ", ".join(f"{f['name']} ({f['flag']})" for f in flagged)
        parts.append(f"Individually flagged: {names}.")
    return " ".join(parts)
