"""Tests for deterministic financial and production calculators."""
import pytest
from app.tools.calculators import (
    calculate_daily_feed_cost,
    calculate_substitution_cost,
    calculate_daily_revenue,
    calculate_margin,
    calculate_intervention_roi,
    calculate_full_daily_cost,
    check_budget,
)


def test_calculate_daily_feed_cost():
    res = calculate_daily_feed_cost(price_per_kg=45.0, kg_per_cow=6.0, num_cows=24)
    assert res["per_cow_inr"] == 270.0
    assert res["total_inr"] == 6480.0


def test_calculate_substitution_cost():
    # 50% substitution of 45 INR feed with 30 INR feed
    res = calculate_substitution_cost(
        feed_a_price=45.0,
        feed_b_price=30.0,
        kg_per_cow=6.0,
        substitution_pct=50.0,
        num_cows=24,
    )
    # Original: 6 * 45 = 270 per cow, total = 6480
    assert res["original_per_cow_inr"] == 270.0
    assert res["original_total_inr"] == 6480.0
    # New: 3 * 45 + 3 * 30 = 135 + 90 = 225 per cow, total = 5400
    assert res["new_per_cow_inr"] == 225.0
    assert res["new_total_inr"] == 5400.0
    assert res["daily_saving_inr"] == 1080.0
    assert res["kg_feed_a"] == 72.0
    assert res["kg_feed_b"] == 72.0


def test_calculate_daily_revenue():
    rev = calculate_daily_revenue(milk_litres=410.0, price_per_litre=35.0)
    assert rev == 14350.0


def test_calculate_margin():
    margin = calculate_margin(revenue_inr=14350.0, feed_cost_inr=5400.0, other_costs_inr=600.0)
    assert margin["revenue_inr"] == 14350.0
    assert margin["feed_cost_inr"] == 5400.0
    assert margin["total_cost_inr"] == 6000.0
    assert margin["margin_inr"] == 8350.0


def test_check_budget():
    within = check_budget(total_cost_inr=4500.0, budget_inr=5000.0)
    assert within["within_budget"] is True
    assert within["overshoot_inr"] == 0.0

    exceeded = check_budget(total_cost_inr=5800.0, budget_inr=5000.0)
    assert exceeded["within_budget"] is False
    assert exceeded["overshoot_inr"] == 800.0


def test_calculate_full_daily_cost():
    res = calculate_full_daily_cost(
        concentrate_kg=6.0,
        concentrate_price=45.0,
        green_fodder_kg=25.0,
        green_fodder_price=3.0,
        dry_fodder_kg=5.0,
        dry_fodder_price=5.0,
        mineral_g=50.0,
        mineral_price_per_kg=85.0,
        num_cows=24,
        intervention_cost=500.0,
    )
    # Conc: 270, Green: 75, Dry: 25, Mineral: 4.25 -> Per cow = 374.25
    assert res["feed_per_cow_inr"] == 374.25
    assert res["feed_total_inr"] == 8982.0
    assert res["total_daily_cost_inr"] == 9482.0
