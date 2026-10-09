"""Tests for handling missing and partial data gracefully without hallucination."""
import pytest
from app.agents.farm_data import run as run_farm_data
from app.agents.nutrition import run as run_nutrition
from app.agents.risk_environment import run as run_risk_environment


def test_farm_data_detects_missing_records():
    res = run_farm_data(farm_id="demo-farm-01")
    assert res["executed"] is True
    # Should contain structured findings without errors
    assert "production_trend" in res["findings"]
    assert "flagged_animals" in res["findings"]
    assert isinstance(res["missing_data"], list)


def test_nutrition_missing_data_warnings():
    res = run_nutrition(farm_id="demo-farm-01")
    assert res["executed"] is True
    assert "disclaimer" in res
    assert "cheaper_alternatives" in res["findings"]


def test_risk_environment_safety_and_vet_flags():
    res = run_risk_environment(farm_id="demo-farm-01")
    assert res["executed"] is True
    assert "safety_note" in res
    assert "veterinary_review_recommended" in res["findings"]
    # The safety note must clearly state decision support rather than diagnosis
    assert "not constitute a veterinary diagnosis" in res["safety_note"]
