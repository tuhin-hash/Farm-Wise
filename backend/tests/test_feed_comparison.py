"""Tests for feed comparison and nutritional blending logic."""
import pytest
from app.tools.feed_comparison import (
    compare_feeds,
    calculate_blended_nutrition,
    find_cheaper_alternatives,
    evaluate_feed_substitution,
)


@pytest.fixture
def sample_feeds():
    feed_a = {
        "feed_id": "feed-soybean-meal",
        "name": "Soybean Meal",
        "category": "concentrate",
        "current_price_inr_per_kg": 45.0,
        "nutrition_per_kg": {
            "crude_protein_pct": 44.0,
            "tdn_pct": 75.0,
            "crude_fibre_pct": 7.0,
            "calcium_pct": 0.3,
            "phosphorus_pct": 0.65,
            "metabolizable_energy_mcal": 2.65,
        },
    }
    feed_b = {
        "feed_id": "feed-cottonseed-meal",
        "name": "Cottonseed Meal",
        "category": "concentrate",
        "current_price_inr_per_kg": 30.0,
        "nutrition_per_kg": {
            "crude_protein_pct": 36.0,
            "tdn_pct": 70.0,
            "crude_fibre_pct": 12.0,
            "calcium_pct": 0.2,
            "phosphorus_pct": 1.0,
            "metabolizable_energy_mcal": 2.45,
        },
    }
    return feed_a, feed_b


def test_compare_feeds(sample_feeds):
    feed_a, feed_b = sample_feeds
    comp = compare_feeds(feed_a, feed_b)
    assert comp["price_diff_inr"] == -15.0
    assert comp["protein_diff_pct"] == -8.0
    assert comp["energy_diff_mcal"] == -0.2
    assert any("cheaper" in t for t in comp["tradeoffs"])
    assert any("Protein drops" in t for t in comp["tradeoffs"])


def test_calculate_blended_nutrition(sample_feeds):
    feed_a, feed_b = sample_feeds
    # 50% blend
    blended = calculate_blended_nutrition(feed_a, feed_b, substitution_pct=50.0)
    assert blended["crude_protein_pct"] == 40.0
    assert blended["tdn_pct"] == 72.5
    assert blended["metabolizable_energy_mcal"] == 2.55


def test_find_cheaper_alternatives(sample_feeds):
    feed_a, feed_b = sample_feeds
    alts = find_cheaper_alternatives(feed_a, [feed_a, feed_b], same_category=True)
    assert len(alts) == 1
    assert alts[0]["feed"]["feed_id"] == "feed-cottonseed-meal"
