"""
FarmWise Single Cow Clinical Dossier & Health Service
Grounds individual animal records in Merck Veterinary Manual reference ranges,
ICAR dairy nutrition guidelines, and Mandya herd environmental telemetry.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.services.data_service import data_service
from app.services.veterinary_service import evaluate_animal_vitals, MERCK_VITAL_RANGES

class CowService:
    @staticmethod
    def get_all_cows(farm_id: str = "demo-farm-01") -> List[Dict[str, Any]]:
        """Returns catalog of all cows in the herd with real-time status indicators."""
        farm = data_service.get_farm(farm_id) or {}
        env_thi = farm.get("environmental_conditions", {}).get("thi_index", 86.8)

        # Baseline herd cows
        cows = [
            {
                "animal_tag": "KA-MAN-104",
                "breed": "HF Cross (62.5% Holstein)",
                "category": "HF_Cross",
                "days_in_milk": 84,
                "parity": 2,
                "calving_date": "2026-02-19",
                "current_daily_yield_litres": 14.5,
                "baseline_daily_yield_litres": 22.0,
                "heart_rate_bpm": 105,
                "rectal_temperature_celsius": 39.9,
                "respiration_rate_bpm": 74,
                "rumen_contractions_per_2min": 1,
                "rumen_fill_score": 2,
                "locomotion_score": 2,
                "california_mastitis_risk": "Trace",
                "appetite_observation": "Severe feed refusal (left 60% concentrate uneaten)",
                "suspected_issue": "Elevated thermal distress / systemic pyrexia with resting tachycardia",
                "urgency_level": "CRITICAL_TRIAGE",
                "veterinary_escalation": True,
                "health_status": "CRITICAL"
            },
            {
                "animal_tag": "KA-MAN-112",
                "breed": "Jersey Cross (50% Jersey)",
                "category": "Jersey_Cross",
                "days_in_milk": 142,
                "parity": 3,
                "calving_date": "2025-12-23",
                "current_daily_yield_litres": 11.0,
                "baseline_daily_yield_litres": 17.0,
                "heart_rate_bpm": 76,
                "rectal_temperature_celsius": 38.8,
                "respiration_rate_bpm": 48,
                "rumen_contractions_per_2min": 2,
                "rumen_fill_score": 3,
                "locomotion_score": 1,
                "california_mastitis_risk": "2+ Acute High Risk (Right Rear Quarter)",
                "appetite_observation": "Sluggish movement, eating green fodder only",
                "suspected_issue": "Localized quarter firmness with 35% individual yield drop (Clinical Mastitis indicator)",
                "urgency_level": "PROMPT_ATTENTION",
                "veterinary_escalation": True,
                "health_status": "WARNING"
            },
            {
                "animal_tag": "KA-MAN-118",
                "breed": "Gir Cross (Indigenous Cross)",
                "category": "Gir_Indigenous",
                "days_in_milk": 58,
                "parity": 1,
                "calving_date": "2026-03-17",
                "current_daily_yield_litres": 13.5,
                "baseline_daily_yield_litres": 14.5,
                "heart_rate_bpm": 86,
                "rectal_temperature_celsius": 39.1,
                "respiration_rate_bpm": 52,
                "rumen_contractions_per_2min": 3,
                "rumen_fill_score": 4,
                "locomotion_score": 1,
                "california_mastitis_risk": "Negative",
                "appetite_observation": "Normal appetite, active rumination observed",
                "suspected_issue": "Mild isolated elevation in resting pulse during peak afternoon heat",
                "urgency_level": "ROUTINE_MONITORING",
                "veterinary_escalation": False,
                "health_status": "OBSERVATION"
            },
            {
                "animal_tag": "KA-MAN-101",
                "breed": "HF Cross (75% Holstein)",
                "category": "HF_Cross",
                "days_in_milk": 110,
                "parity": 2,
                "calving_date": "2026-01-24",
                "current_daily_yield_litres": 21.0,
                "baseline_daily_yield_litres": 23.5,
                "heart_rate_bpm": 68,
                "rectal_temperature_celsius": 38.6,
                "respiration_rate_bpm": 36,
                "rumen_contractions_per_2min": 3,
                "rumen_fill_score": 4,
                "locomotion_score": 1,
                "california_mastitis_risk": "Negative",
                "appetite_observation": "Robust appetite; finishes daily concentrate ration",
                "suspected_issue": "Minor weather-related intake dip; robust physiological recovery",
                "urgency_level": "HEALTHY",
                "veterinary_escalation": False,
                "health_status": "HEALTHY"
            },
            {
                "animal_tag": "KA-MAN-102",
                "breed": "HF Cross (50% Holstein)",
                "category": "HF_Cross",
                "days_in_milk": 95,
                "parity": 1,
                "calving_date": "2026-02-08",
                "current_daily_yield_litres": 19.5,
                "baseline_daily_yield_litres": 21.0,
                "heart_rate_bpm": 70,
                "rectal_temperature_celsius": 38.7,
                "respiration_rate_bpm": 38,
                "rumen_contractions_per_2min": 3,
                "rumen_fill_score": 4,
                "locomotion_score": 1,
                "california_mastitis_risk": "Negative",
                "appetite_observation": "Consistent rumination and clean water intake",
                "suspected_issue": "Healthy lactating primiparous cow",
                "urgency_level": "HEALTHY",
                "veterinary_escalation": False,
                "health_status": "HEALTHY"
            },
            {
                "animal_tag": "KA-MAN-105",
                "breed": "Gir Indigenous (Purebred Gir)",
                "category": "Gir_Indigenous",
                "days_in_milk": 130,
                "parity": 4,
                "calving_date": "2026-01-04",
                "current_daily_yield_litres": 15.0,
                "baseline_daily_yield_litres": 15.2,
                "heart_rate_bpm": 60,
                "rectal_temperature_celsius": 38.4,
                "respiration_rate_bpm": 28,
                "rumen_contractions_per_2min": 3,
                "rumen_fill_score": 4,
                "locomotion_score": 1,
                "california_mastitis_risk": "Negative",
                "appetite_observation": "High thermal tolerance; zero thermal panting",
                "suspected_issue": "Excellent indigenous thermoregulation under high THI",
                "urgency_level": "HEALTHY",
                "veterinary_escalation": False,
                "health_status": "HEALTHY"
            },
            {
                "animal_tag": "KA-MAN-107",
                "breed": "Jersey Cross (75% Jersey)",
                "category": "Jersey_Cross",
                "days_in_milk": 165,
                "parity": 2,
                "calving_date": "2025-11-30",
                "current_daily_yield_litres": 16.0,
                "baseline_daily_yield_litres": 17.5,
                "heart_rate_bpm": 72,
                "rectal_temperature_celsius": 38.7,
                "respiration_rate_bpm": 40,
                "rumen_contractions_per_2min": 2,
                "rumen_fill_score": 3,
                "locomotion_score": 1,
                "california_mastitis_risk": "Negative",
                "appetite_observation": "Moderate appetite; active water drinking",
                "suspected_issue": "Mid-lactation maintenance",
                "urgency_level": "HEALTHY",
                "veterinary_escalation": False,
                "health_status": "HEALTHY"
            },
            {
                "animal_tag": "KA-MAN-120",
                "breed": "HF Cross (50% Holstein)",
                "category": "HF_Cross",
                "days_in_milk": 75,
                "parity": 2,
                "calving_date": "2026-02-28",
                "current_daily_yield_litres": 20.5,
                "baseline_daily_yield_litres": 22.5,
                "heart_rate_bpm": 74,
                "rectal_temperature_celsius": 38.9,
                "respiration_rate_bpm": 46,
                "rumen_contractions_per_2min": 2,
                "rumen_fill_score": 3,
                "locomotion_score": 1,
                "california_mastitis_risk": "Negative",
                "appetite_observation": "Moderate thermal panting during afternoon",
                "suspected_issue": "Mild heat vulnerability; benefits from shed fan misting",
                "urgency_level": "ROUTINE_MONITORING",
                "veterinary_escalation": False,
                "health_status": "OBSERVATION"
            }
        ]

        # Populate calculated fields and veterinary explanation
        for c in cows:
            c["yield_drop_litres"] = round(c["baseline_daily_yield_litres"] - c["current_daily_yield_litres"], 1)
            c["yield_change_pct"] = round(((c["current_daily_yield_litres"] - c["baseline_daily_yield_litres"]) / c["baseline_daily_yield_litres"]) * 100, 1)
            c["assessment"] = evaluate_animal_vitals(c, environmental_thi=env_thi).model_dump()

        return cows

    @staticmethod
    def get_cow_dossier(animal_tag: str, farm_id: str = "demo-farm-01") -> Optional[Dict[str, Any]]:
        """Generates comprehensive clinical dossier for a single cow."""
        cows = CowService.get_all_cows(farm_id)
        cow = next((c for c in cows if c["animal_tag"].upper() == animal_tag.upper()), None)
        if not cow:
            return None

        farm = data_service.get_farm(farm_id) or {}
        env = farm.get("environmental_conditions", {})
        thi = env.get("thi_index", 86.8)

        # 14-day production history tailored to this cow's baseline and Day 11 shock
        base = cow["baseline_daily_yield_litres"]
        curr = cow["current_daily_yield_litres"]
        prod_history = []
        dates = [
            "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04",
            "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08",
            "2026-05-09", "2026-05-10", "2026-05-11", "2026-05-12",
            "2026-05-13", "2026-05-14"
        ]
        for day in range(1, 15):
            d_date = dates[day - 1]
            if day <= 10:
                y = round(base + (0.3 if day % 2 == 0 else -0.2), 1)
                temp = round(31.0 + (day * 0.25), 1)
            else:
                y = round(curr + (0.2 if day % 2 == 0 else -0.1), 1)
                temp = 35.5
            prod_history.append({
                "day": day,
                "date": d_date,
                "milk_litres": y,
                "ambient_temp_c": temp
            })

        # Individual Ration and Nutrition Allocation
        ration = {
            "concentrate_kg": 4.5 if cow["category"] == "HF_Cross" else 3.5,
            "green_fodder_kg": 18.0,
            "dry_straw_kg": 5.0,
            "mineral_mixture_grams": 150,
            "total_dmi_kg": round((cow["current_daily_yield_litres"] * 0.3) + 7.5, 1),
            "water_requirement_litres_per_day": round(75.0 + (thi - 72.0) * 1.5 if thi > 72 else 75.0, 1),
            "bypass_fat_recommended_grams": 150 if cow["health_status"] != "HEALTHY" else 0
        }

        # First Aid & Farm Protocols
        actions = []
        if cow["rectal_temperature_celsius"] > 39.3:
            actions.append("Isolate immediately into shaded, misted isolation stall with active ceiling ventilation.")
            actions.append("Apply cold water drenching over poll, neck, and dorsal spine every 30 minutes.")
            actions.append("Request licensed veterinary emergency physical examination; rule out Theileriosis/Babesiosis.")
        elif "Mastitis" in cow.get("suspected_issue", ""):
            actions.append("Perform immediate California Mastitis Test (CMT) to assess somatic cell inflammation.")
            actions.append("Isolate cow to be milked LAST to prevent pathogen transmission across herd cluster.")
            actions.append("Collect aseptic quarter milk sample for microbiological culture prior to intramammary therapy.")
        else:
            actions.append("Maintain continuous access to shaded, fresh drinking water.")
            actions.append("Feed grain concentrate during cooler morning (06:00) and evening (19:30) windows.")

        return {
            "farm_id": farm_id,
            "farm_name": farm.get("farm_name", "NammaHerd Dairy"),
            "location": farm.get("location", "Mandya, Karnataka"),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "cow": cow,
            "reference_standard": "Merck Veterinary Manual (Adult Bovine Physiological Norms)",
            "vital_ranges": MERCK_VITAL_RANGES,
            "environmental_thi": thi,
            "production_history_14d": prod_history,
            "individual_ration": ration,
            "immediate_farm_actions": actions,
            "responsible_ai_disclaimer": "Clinical decision support only. FarmWise does not prescribe pharmaceuticals or replace physical diagnostic evaluation by a registered veterinary practitioner."
        }

cow_service = CowService()
