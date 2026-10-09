import pytest
from app.tools.calculators import (
    calculate_herd_feed_cost,
    calculate_milk_revenue,
    calculate_daily_margin,
    calculate_feed_blend,
    calculate_temperature_humidity_index
)

def test_calculate_herd_feed_cost_deterministic():
    items = [
        {"quantity_kg_per_cow": 4.5, "unit_price_inr_per_kg": 33.0},
        {"quantity_kg_per_cow": 18.0, "unit_price_inr_per_kg": 2.5},
        {"quantity_kg_per_cow": 5.0, "unit_price_inr_per_kg": 4.5},
        {"quantity_kg_per_cow": 0.15, "unit_price_inr_per_kg": 65.0}
    ]
    # (4.5*33 + 18*2.5 + 5*4.5 + 0.15*65) = 148.5 + 45.0 + 22.5 + 9.75 = 225.75 per cow
    # 225.75 * 24 cows = 5418.00
    cost = calculate_herd_feed_cost(items, 24)
    assert cost == 5418.00

    # Repeatability test
    cost_repeat = calculate_herd_feed_cost(items, 24)
    assert cost == cost_repeat

def test_calculate_milk_revenue():
    revenue = calculate_milk_revenue(410.0, 38.0)
    assert revenue == 15580.0

def test_calculate_daily_margin():
    revenue = 15580.0
    feed_cost = 5418.0
    intervention = 200.0
    margin = calculate_daily_margin(revenue, feed_cost, intervention)
    assert margin == 9962.0

def test_calculate_feed_blend_substitution():
    feed_a = {
        "feed_id": "feed-conc-01",
        "name": "Commercial Concentrate",
        "unit_price_inr_per_kg": 33.0,
        "crude_protein_pct": 20.0,
        "energy_tdn_pct": 72.0,
        "energy_me_mj_per_kg": 11.2
    }
    feed_b = {
        "feed_id": "feed-dorb-01",
        "name": "DORB",
        "unit_price_inr_per_kg": 16.0,
        "crude_protein_pct": 13.0,
        "energy_tdn_pct": 56.0,
        "energy_me_mj_per_kg": 8.8
    }

    # 25% substitution: 75% Feed A + 25% Feed B
    blend = calculate_feed_blend(feed_a, feed_b, 25.0)
    expected_price = (0.75 * 33.0) + (0.25 * 16.0)  # 24.75 + 4.0 = 28.75
    expected_cp = (0.75 * 20.0) + (0.25 * 13.0)     # 15.0 + 3.25 = 18.25
    expected_tdn = (0.75 * 72.0) + (0.25 * 56.0)   # 54.0 + 14.0 = 68.0

    assert blend.blended_unit_price_inr_per_kg == expected_price
    assert blend.blended_crude_protein_pct == expected_cp
    assert blend.blended_energy_tdn_pct == expected_tdn
    assert blend.price_delta_inr_per_kg == round(expected_price - 33.0, 2)
    assert blend.substitution_percentage == 25.0

def test_calculate_temperature_humidity_index():
    # 35.5 C and 68% RH
    thi = calculate_temperature_humidity_index(35.5, 68.0)
    assert thi > 80.0  # High heat stress
