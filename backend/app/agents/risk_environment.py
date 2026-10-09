"""Livestock Risk and Environment Agent for FarmWise.
Examines temperature, relative humidity, calculated THI, water consumption patterns,
and health alerts. Identifies environmental stress factors.
Flags uncertain or serious situations for veterinary physical review.
Does NOT diagnose diseases or prescribe veterinary medication.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.data_service import data_service
from app.tools.calculators import calculate_temperature_humidity_index

class RiskEnvironmentAgent:
    @staticmethod
    def execute(farm_id: str = "demo-farm-01") -> Dict[str, Any]:
        farm = data_service.get_farm(farm_id) or {}
        env = farm.get("environmental_conditions", {})
        flagged_animals = data_service.get_flagged_animals(farm_id)

        temp_c = float(env.get("ambient_temperature_celsius", 35.5))
        rh_pct = float(env.get("relative_humidity_percentage", 68.0))
        thi = calculate_temperature_humidity_index(temp_c, rh_pct)

        # Heat stress evaluation
        if thi >= 88.0:
            stress_category = "SEVERE_EMERGENCY"
            stress_desc = "Critical heat stress. Severe risk of heat stroke, ruminal stasis, and mortality."
        elif thi >= 79.0:
            stress_category = "MODERATE_TO_SEVERE"
            stress_desc = "Moderate to severe heat stress. Cows experience open-mouth breathing, elevated body temperature, reduced rumination time, and direct milk yield suppression."
        elif thi >= 72.0:
            stress_category = "MILD_HEAT_STRESS"
            stress_desc = "Mild heat stress threshold exceeded. Lactating cows begin reducing dry matter intake."
        else:
            stress_category = "COMFORTABLE"
            stress_desc = "Thermal comfort zone for dairy cattle."

        # Water intake risk analysis
        water_data = farm.get("water_consumption", {})
        curr_water = float(water_data.get("current_litres_per_cow", 64.0))
        expected_heat_water = 100.0  # Under 35°C, high yield dairy cows typically require 95-110L of water
        water_deficit_per_cow = round(expected_heat_water - curr_water, 1)

        water_assessment = {
            "recorded_intake_litres": curr_water,
            "expected_intake_under_heat_litres": expected_heat_water,
            "estimated_deficit_litres": water_deficit_per_cow,
            "risk_hypothesis": (
                "Water consumption decreased despite severe ambient thermal stress. "
                "Possible physical drivers: (1) Unshaded metal/plastic water troughs absorbing solar radiation, making water hot; "
                "(2) Biofilm/algal contamination causing odour refusal; "
                "(3) Inadequate trough perimeter leading to dominant cow bullying; "
                "(4) Subclinical dehydration impairing thermoregulation and milk synthesis."
            )
        }

        # Urgent veterinary referrals (Do NOT diagnose or prescribe!)
        veterinary_referrals = []
        for anim in flagged_animals:
            veterinary_referrals.append({
                "animal_tag": anim.get("animal_tag"),
                "breed": anim.get("breed"),
                "vital_signs": f"Rectal Temp: {anim.get('rectal_temperature_celsius')}°C, Respiration: {anim.get('respiration_rate_bpm')} bpm",
                "observations": anim.get("appetite_observation"),
                "risk_flag": anim.get("suspected_issue"),
                "action_guidance": "VETERINARY REVIEW MANDATORY. Immediate physical examination by a licensed veterinary practitioner is required prior to applying herd-wide management changes.",
                "disclaimer": "FarmWise does not provide autonomous clinical diagnostics or drug prescriptions."
            })

        evidence = {
            "ambient_temperature_celsius": temp_c,
            "relative_humidity_percentage": rh_pct,
            "calculated_thi": thi,
            "heat_stress_category": stress_category,
            "heat_stress_description": stress_desc,
            "water_consumption_risk": water_assessment,
            "veterinary_escalations": veterinary_referrals,
            "veterinary_escalation_count": len(veterinary_referrals),
            "safety_recommendations": [
                "Provide continuous clean, chilled/shaded fresh drinking water within 15 meters of feeding lines.",
                "Implement active air circulation (fans >2.5 m/s) and intermittent coarse droplet sprinkling over cows at feeding.",
                "Isolate Cow KA-MAN-104 and Cow KA-MAN-112 for urgent veterinarian diagnosis; do not assume yield loss is purely nutritional.",
                "Never administer antibiotics or prescription pharmaceuticals without qualified veterinary direction."
            ],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        return evidence

risk_environment_agent = RiskEnvironmentAgent()
