"""Farm Data Agent for FarmWise.
Retrieves synthetic farm records, analyzes production and water trends,
and inspects flagged individual animals versus herd patterns.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.data_service import data_service

class FarmDataAgent:
    @staticmethod
    def execute(farm_id: str = "demo-farm-01") -> Dict[str, Any]:
        farm = data_service.get_farm(farm_id) or {}
        flagged_animals = data_service.get_flagged_animals(farm_id)
        history = data_service.get_production_history(farm_id, days=14)

        prod = farm.get("daily_production", {})
        water = farm.get("water_consumption", {})
        curr_milk = float(prod.get("current_litres", 410.0))
        base_milk = float(prod.get("baseline_litres", 445.0))
        milk_drop_pct = round(((curr_milk - base_milk) / base_milk) * 100.0, 2)

        curr_water = float(water.get("current_litres_per_cow", 64.0))
        base_water = float(water.get("baseline_litres_per_cow", 78.0))
        water_drop_pct = round(((curr_water - base_water) / base_water) * 100.0, 2)

        # Herd vs Individual assessment
        herd_pattern = (
            f"Herd milk production declined by {abs(milk_drop_pct)}% (from {base_milk}L to {curr_milk}L/day) "
            f"across 24 cows over the past 14 days. Water intake contracted by {abs(water_drop_pct)}% (from {base_water}L to {curr_water}L/cow/day)."
        )

        individual_deviations = []
        for anim in flagged_animals:
            individual_deviations.append({
                "tag": anim.get("animal_tag"),
                "breed": anim.get("breed"),
                "rectal_temp_c": anim.get("rectal_temperature_celsius"),
                "symptoms": anim.get("appetite_observation"),
                "suspected_issue": anim.get("suspected_issue"),
                "veterinary_escalation_required": bool(anim.get("veterinary_escalation"))
            })

        # Missing data warnings (crucial for integrity)
        missing_data = [
            "Individual stall-level water meters absent; water intake reflects total herd trough estimation.",
            "Individual cow daily milk yield is unmetered; only bulk tank volume and visual observation recorded.",
            "Forage laboratory dry matter and mycotoxin screening tests are unrecorded for the current batch."
        ]

        evidence = {
            "source": "Synthetic SQLite farm records (Sri Lakshmi Dairy Farm, Mandya)",
            "animal_count": farm.get("animal_count", 24),
            "current_milk_litres": curr_milk,
            "baseline_milk_litres": base_milk,
            "milk_trend_percentage": milk_drop_pct,
            "current_water_litres_per_cow": curr_water,
            "baseline_water_litres_per_cow": base_water,
            "water_trend_percentage": water_drop_pct,
            "herd_pattern_summary": herd_pattern,
            "flagged_animals_count": len(flagged_animals),
            "flagged_animals": individual_deviations,
            "missing_data_warnings": missing_data,
            "data_mode": farm.get("data_mode", "synthetic_demo"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        return evidence

farm_data_agent = FarmDataAgent()
