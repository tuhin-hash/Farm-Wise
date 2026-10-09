"""Deterministic calculation tools for FarmWise livestock economics.
All calculations use exact deterministic arithmetic in Python.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field

class RationItem(BaseModel):
    feed_id: str
    feed_name: str
    quantity_kg_per_cow: float
    unit_price_inr_per_kg: float

class FeedBlendResult(BaseModel):
    substitution_percentage: float
    feed_a_id: str
    feed_a_name: str
    feed_a_weight_pct: float
    feed_b_id: str
    feed_b_name: str
    feed_b_weight_pct: float
    blended_unit_price_inr_per_kg: float
    blended_crude_protein_pct: float
    blended_energy_tdn_pct: float
    blended_energy_me_mj_per_kg: float
    price_delta_inr_per_kg: float
    crude_protein_delta_pct: float
    energy_tdn_delta_pct: float

def calculate_herd_feed_cost(items: List[Dict[str, Any]], animal_count: int) -> float:
    """Calculates total daily herd feed cost in INR deterministically.
    Total Daily Cost = Sum(quantity_kg_per_cow * unit_price_inr_per_kg) * animal_count
    """
    if animal_count <= 0:
        return 0.0
    cost_per_cow = sum(
        float(item.get("quantity_kg_per_cow", 0.0)) * float(item.get("unit_price_inr_per_kg", 0.0))
        for item in items
    )
    return round(cost_per_cow * animal_count, 2)

def calculate_milk_revenue(daily_litres: float, milk_sale_price_inr: float) -> float:
    """Calculates daily milk revenue in INR.
    Revenue = daily_litres * milk_sale_price_inr
    """
    if daily_litres <= 0 or milk_sale_price_inr <= 0:
        return 0.0
    return round(float(daily_litres) * float(milk_sale_price_inr), 2)

def calculate_daily_margin(
    revenue_inr: float,
    feed_cost_inr: float,
    intervention_cost_inr: float = 0.0,
    other_overhead_inr: float = 0.0
) -> float:
    """Calculates estimated daily operating margin over feed and direct intervention costs.
    Margin = Revenue - Feed Cost - Intervention Daily Cost - Other Overhead
    """
    total_costs = float(feed_cost_inr) + float(intervention_cost_inr) + float(other_overhead_inr)
    return round(float(revenue_inr) - total_costs, 2)

def calculate_feed_blend(
    feed_a: Dict[str, Any],
    feed_b: Dict[str, Any],
    substitution_percentage: float
) -> FeedBlendResult:
    """Calculates weighted nutritional composition and price when Feed B substitutes a percentage of Feed A.
    substitution_percentage is clamped between 0.0 and 100.0.
    """
    sub_pct = max(0.0, min(100.0, float(substitution_percentage)))
    weight_b = sub_pct / 100.0
    weight_a = 1.0 - weight_b

    price_a = float(feed_a.get("unit_price_inr_per_kg", 0.0))
    price_b = float(feed_b.get("unit_price_inr_per_kg", 0.0))
    blended_price = (weight_a * price_a) + (weight_b * price_b)

    cp_a = float(feed_a.get("crude_protein_pct", 0.0))
    cp_b = float(feed_b.get("crude_protein_pct", 0.0))
    blended_cp = (weight_a * cp_a) + (weight_b * cp_b)

    tdn_a = float(feed_a.get("energy_tdn_pct", 0.0))
    tdn_b = float(feed_b.get("energy_tdn_pct", 0.0))
    blended_tdn = (weight_a * tdn_a) + (weight_b * tdn_b)

    me_a = float(feed_a.get("energy_me_mj_per_kg", 0.0) or 0.0)
    me_b = float(feed_b.get("energy_me_mj_per_kg", 0.0) or 0.0)
    blended_me = (weight_a * me_a) + (weight_b * me_b)

    return FeedBlendResult(
        substitution_percentage=round(sub_pct, 2),
        feed_a_id=feed_a.get("feed_id", ""),
        feed_a_name=feed_a.get("name", "Feed A"),
        feed_a_weight_pct=round(weight_a * 100.0, 1),
        feed_b_id=feed_b.get("feed_id", ""),
        feed_b_name=feed_b.get("name", "Feed B"),
        feed_b_weight_pct=round(weight_b * 100.0, 1),
        blended_unit_price_inr_per_kg=round(blended_price, 2),
        blended_crude_protein_pct=round(blended_cp, 2),
        blended_energy_tdn_pct=round(blended_tdn, 2),
        blended_energy_me_mj_per_kg=round(blended_me, 2),
        price_delta_inr_per_kg=round(blended_price - price_a, 2),
        crude_protein_delta_pct=round(blended_cp - cp_a, 2),
        energy_tdn_delta_pct=round(blended_tdn - tdn_a, 2)
    )

def calculate_temperature_humidity_index(temp_celsius: float, relative_humidity_pct: float) -> float:
    """Calculates standard NRC Dairy Temperature-Humidity Index (THI).
    THI = (1.8 * T + 32) - ((0.55 - 0.0055 * RH) * (1.8 * T - 26))
    where T is temperature in °C and RH is relative humidity in %.
    Thresholds for dairy cattle:
      < 72: Comfortable / No Stress
      72 - 78: Mild Heat Stress
      79 - 88: Moderate to Severe Heat Stress
      > 88: Severe / Emergency Danger
    """
    t = float(temp_celsius)
    rh = float(relative_humidity_pct)
    thi = (1.8 * t + 32.0) - ((0.55 - 0.0055 * rh) * (1.8 * t - 26.0))
    return round(thi, 1)
