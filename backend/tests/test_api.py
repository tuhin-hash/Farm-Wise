"""Tests for FastAPI HTTP endpoints using TestClient."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["mode"] in ["demo", "llm"]


def test_dashboard_endpoint():
    response = client.get("/api/dashboard?farm_id=demo-farm-01")
    assert response.status_code == 200
    data = response.json()
    assert data["farm"]["farm_id"] == "demo-farm-01"
    assert data["animal_count"] == 24
    assert len(data["animals_needing_attention"]) > 0
    assert data["daily_milk_litres"] > 0
    assert len(data["production_history"]) >= 7
    assert len(data["environment"]) > 0
    assert len(data["alerts"]) > 0


def test_feeds_endpoint():
    response = client.get("/api/feeds")
    assert response.status_code == 200
    data = response.json()
    assert "feeds" in data
    assert len(data["feeds"]) >= 5


def test_analyze_endpoint():
    payload = {
        "query": "Milk production has dropped and feed prices are rising. What should I do?",
        "farm_id": "demo-farm-01",
        "budget_inr": 5000.0,
        "farmer_strategy": "Reduce concentrate feed and increase green fodder",
        "priorities": {
            "profitability": 0.7,
            "low_cost": 0.8,
            "animal_welfare": 1.0,
            "risk_reduction": 0.9,
        },
    }
    response = client.post("/api/decision/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "decision_id" in data
    assert len(data["strategies"]) >= 4
    assert len(data["scoring"]) >= 4
    assert data["recommended_strategy_id"] != ""
    assert data["recommendation_explanation"] != ""
    assert len(data["execution_trace"]) >= 5
    assert "safety_note" in data


def test_simulate_endpoint():
    payload = {
        "farm_id": "demo-farm-01",
        "feed_a_id": "feed-soybean-meal",
        "feed_b_id": "feed-cottonseed-meal",
        "substitution_pct": 50.0,
        "num_animals": 24,
        "feed_quantity_kg_per_cow": 6.0,
        "milk_price_inr_per_litre": 35.0,
        "intervention_cost_inr_per_day": 0.0,
        "budget_inr": 5000.0,
        "priorities": {
            "profitability": 0.5,
            "low_cost": 0.8,
            "animal_welfare": 0.5,
            "risk_reduction": 0.5,
        },
    }
    response = client.post("/api/decision/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current_scenario" in data
    assert "alternative_scenario" in data
    assert data["cost_difference_inr"] < 0  # cottonseed is cheaper than soybean
    assert len(data["nutritional_tradeoffs"]) > 0
    assert "within_budget" in data
