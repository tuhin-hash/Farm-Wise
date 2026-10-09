"""Livestock Risk & Environment Agent — analyzes environmental conditions and health indicators."""
from __future__ import annotations

import time
from typing import Dict, Any, List

from app.services.data_service import (
    get_environment, get_water_consumption, get_water_trend,
    get_animals_with_flags, get_alerts,
)


def run(farm_id: str, query_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Execute the Risk & Environment Agent.

    Examines temperature, water intake, appetite observations
    and recorded health indicators. Identifies possible contributing factors.
    Flags uncertain or serious situations for veterinary review.
    Does NOT diagnose diseases or prescribe medication.
    """
    start = time.time()

    env = get_environment(farm_id)
    water = get_water_consumption(farm_id)
    water_trend = get_water_trend(farm_id)
    flagged_animals = get_animals_with_flags(farm_id)
    alerts = get_alerts(farm_id)

    # Analyze heat stress
    heat_stress_analysis = _analyze_heat_stress(env)

    # Analyze water consumption
    water_analysis = _analyze_water(water, water_trend, env)

    # Analyze individual animal risks
    animal_risks = _analyze_animal_risks(flagged_animals)

    # Compile risk factors
    risk_factors = []
    vet_required = False
    risk_level = "low"

    if heat_stress_analysis["is_heat_stressed"]:
        risk_factors.append({
            "factor": "Heat stress",
            "severity": heat_stress_analysis["severity"],
            "detail": heat_stress_analysis["description"],
        })
        if heat_stress_analysis["severity"] == "high":
            risk_level = "high"
        elif risk_level != "high":
            risk_level = "medium"

    if water_analysis["is_declining"]:
        risk_factors.append({
            "factor": "Declining water intake",
            "severity": "warning",
            "detail": water_analysis["description"],
        })
        if risk_level == "low":
            risk_level = "medium"

    for ar in animal_risks:
        risk_factors.append({
            "factor": f"Individual: {ar['name']} — {ar['flag']}",
            "severity": ar["severity"],
            "detail": ar["recommendation"],
        })
        if ar["severity"] == "high":
            vet_required = True
            risk_level = "high"

    # Flag for vet if multiple risk factors combine
    if len(risk_factors) >= 3 and not vet_required:
        vet_required = True

    missing = []
    if not env:
        missing.append("No environmental data available")
    if not water:
        missing.append("No water consumption data available")

    duration_ms = int((time.time() - start) * 1000)

    return {
        "agent": "risk_environment",
        "executed": True,
        "duration_ms": duration_ms,
        "findings": {
            "heat_stress": heat_stress_analysis,
            "water_analysis": water_analysis,
            "animal_risks": animal_risks,
            "risk_factors": risk_factors,
            "overall_risk_level": risk_level,
            "veterinary_review_recommended": vet_required,
        },
        "missing_data": missing,
        "summary": _build_summary(risk_factors, risk_level, vet_required),
        "safety_note": (
            "This analysis identifies potential contributing factors based on recorded data. "
            "It does not constitute a veterinary diagnosis. Consult a veterinarian for "
            "clinical assessment, especially for individually flagged animals."
        ),
    }


def _analyze_heat_stress(env: List[Dict]) -> Dict[str, Any]:
    """Analyze environmental data for heat stress indicators."""
    if not env:
        return {"is_heat_stressed": False, "severity": "unknown", "description": "No data"}

    latest = env[-1]
    thi = latest.get("thi_index", 0)
    max_temp = latest.get("max_temp_c", 0)

    if thi >= 82:
        severity = "high" if thi >= 84 else "moderate"
        return {
            "is_heat_stressed": True,
            "severity": severity,
            "current_thi": thi,
            "max_temp_c": max_temp,
            "description": (
                f"THI index at {thi} (threshold: 72). "
                f"Max temperature {max_temp}°C. "
                f"Heat stress is {'high' if severity == 'high' else 'moderate'} — "
                f"expect reduced feed intake, lower milk yield, and increased water demand."
            ),
            "recommendations": [
                "Provide shade and adequate ventilation",
                "Ensure 24/7 access to clean, cool water",
                "Consider fans or misting in resting areas",
                "Adjust feeding times to cooler parts of day (early morning, evening)",
            ],
        }

    return {
        "is_heat_stressed": False,
        "severity": "low",
        "current_thi": thi,
        "max_temp_c": max_temp,
        "description": f"THI at {thi} — within normal range.",
        "recommendations": [],
    }


def _analyze_water(water: List[Dict], trend: Dict, env: List[Dict]) -> Dict[str, Any]:
    """Analyze water consumption patterns."""
    if not water:
        return {"is_declining": False, "description": "No water data available"}

    trend_pct = trend.get("trend_pct", 0)
    latest = water[-1]["avg_per_cow_litres"]

    # Normal range for dairy cows: 80-120 litres/day, more in heat
    is_low = latest < 80
    is_declining = trend_pct < -5

    concern = is_low or is_declining

    # Paradox check: declining water during heat stress
    heat_paradox = False
    if env and env[-1].get("thi_index", 0) >= 82 and is_declining:
        heat_paradox = True

    return {
        "is_declining": is_declining,
        "is_below_normal": is_low,
        "current_avg_per_cow_litres": latest,
        "trend_pct": trend_pct,
        "heat_paradox": heat_paradox,
        "description": _water_description(latest, trend_pct, heat_paradox),
        "concern": concern,
    }


def _water_description(avg: float, trend_pct: float, paradox: bool) -> str:
    parts = [f"Average water intake: {avg} litres/cow/day (trend: {trend_pct:+.1f}%)."]
    if paradox:
        parts.append(
            "CONCERN: Water intake is declining despite heat stress — "
            "cows should be drinking MORE in hot conditions. "
            "Check water accessibility, quality, and trough cleanliness."
        )
    elif avg < 80:
        parts.append("Below typical range (80-120 L/day). Monitor closely.")
    return " ".join(parts)


def _analyze_animal_risks(flagged: List[Dict]) -> List[Dict]:
    """Assess risk for individually flagged animals."""
    risks = []
    for a in flagged:
        flag = a.get("health_flag", "")
        severity = "medium"
        rec = "Monitor and record changes."

        if flag == "reduced_appetite":
            severity = "medium"
            rec = (
                "Monitor feed intake for 48h. If appetite doesn't return, "
                "a veterinary check is recommended to rule out metabolic or digestive issues."
            )
        elif flag == "low_water_intake":
            severity = "medium"
            rec = (
                "Ensure water access and check trough cleanliness. "
                "Low intake in heat can lead to dehydration. Watch for signs of distress."
            )
        elif flag == "mild_lameness":
            severity = "medium"
            rec = (
                "Inspect hooves for injury or infection. If lameness persists >48h "
                "or worsens, veterinary hoof-trimming consultation is advised."
            )
        elif flag:
            severity = "medium"
            rec = f"Flagged with '{flag}'. Observe and record. Consult vet if condition worsens."

        risks.append({
            "animal_id": a["animal_id"],
            "name": a["name"],
            "flag": flag,
            "severity": severity,
            "recommendation": rec,
        })
    return risks


def _build_summary(risk_factors: List[Dict], risk_level: str, vet_required: bool) -> str:
    parts = [f"Overall risk level: {risk_level}."]
    if risk_factors:
        parts.append(f"Identified {len(risk_factors)} risk factor(s):")
        for rf in risk_factors:
            parts.append(f"  - {rf['factor']} ({rf['severity']})")
    if vet_required:
        parts.append("Veterinary review is recommended.")
    return " ".join(parts)
