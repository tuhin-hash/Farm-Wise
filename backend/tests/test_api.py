import pytest
from fastapi.testclient import TestClient

def test_api_health(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["data_mode"] == "synthetic_demo"
    assert "llm_enabled" in data

def test_api_dashboard(client: TestClient):
    response = client.get("/api/dashboard?farm_id=demo-farm-01")
    assert response.status_code == 200
    data = response.json()
    assert data["farm_id"] == "demo-farm-01"
    assert data["animal_count"] == 24
    assert data["daily_production"]["current_litres"] == 410.0
    assert data["daily_production"]["baseline_litres"] == 445.0
    assert data["water_consumption"]["current_litres_per_cow"] == 64.0
    assert len(data["active_alerts"]) > 0
    assert len(data["animals_requiring_attention"]) >= 2
    assert "veterinary_assessment" in data["animals_requiring_attention"][0]
    assert len(data["production_history_14d"]) == 14

def test_api_feeds(client: TestClient):
    response = client.get("/api/feeds")
    assert response.status_code == 200
    data = response.json()
    assert data["total_feeds"] >= 8
    feed_ids = [f["feed_id"] for f in data["feeds"]]
    assert "feed-conc-01" in feed_ids
    assert "feed-dorb-01" in feed_ids
    assert "feed-maize-01" in feed_ids

def test_api_decision_analyze(client: TestClient):
    payload = {
        "query": "Milk production has dropped and feed prices are rising. What should I do?",
        "farm_id": "demo-farm-01",
        "budget_inr": 5000,
        "farmer_strategy": "Reduce concentrate feed and increase green fodder",
        "priorities": {
            "profitability": 0.7,
            "low_cost": 0.8,
            "animal_welfare": 1.0,
            "risk_reduction": 0.9
        }
    }
    response = client.post("/api/decision/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "decision_id" in data
    assert len(data["candidate_strategies"]) >= 4
    assert data["recommended_strategy_id"] is not None
    assert len(data["execution_trace"]) >= 5
    assert len(data["assumptions"]) > 0
    assert len(data["missing_data"]) > 0
    assert len(data["safety_notes"]) > 0

    # Ensure winner respects budget or is explicitly flagged
    winner = next(s for s in data["candidate_strategies"] if s["strategy_id"] == data["recommended_strategy_id"])
    assert winner["eligible"] is True

def test_api_decision_simulate(client: TestClient):
    payload = {
        "feed_a_id": "feed-conc-01",
        "feed_b_id": "feed-dorb-01",
        "substitution_percentage": 25.0,
        "animal_count": 24,
        "milk_sale_price_inr": 38.0,
        "daily_milk_production_litres": 410.0,
        "intervention_cost_inr": 130.0,
        "budget_inr": 5000.0
    }
    response = client.post("/api/decision/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "current_scenario" in data
    assert "alternative_scenario" in data
    assert "cost_difference_daily_inr" in data
    assert "nutritional_tradeoffs" in data
    assert "eligible_under_budget" in data
    assert data["alternative_scenario"]["blended_concentrate_price_inr_per_kg"] < 33.0

def test_api_decision_lifecycle_and_outcome(client: TestClient):
    # Step 1: Analyze
    payload_analyze = {
        "query": "Concentrate price jumped 18%. Can I substitute DORB?",
        "farm_id": "demo-farm-01",
        "budget_inr": 5000,
        "farmer_strategy": "Swap 30% concentrate for DORB"
    }
    res_analyze = client.post("/api/decision/analyze", json=payload_analyze)
    assert res_analyze.status_code == 200
    decision_id = res_analyze.json()["decision_id"]

    # Step 2: Get history
    res_hist = client.get("/api/decisions")
    assert res_hist.status_code == 200
    decisions = res_hist.json()["decisions"]
    assert any(d["decision_id"] == decision_id for d in decisions)

    # Step 3: Farmer selects strategy
    save_payload = {
        "decision_id": decision_id,
        "farm_id": "demo-farm-01",
        "selected_strategy_id": "strat-hybrid-synergistic",
        "farmer_notes": "Implemented partial DORB blend and cleaned water troughs."
    }
    res_save = client.post("/api/decisions", json=save_payload)
    assert res_save.status_code == 200

    # Step 4: Record retrospective outcome
    outcome_payload = {
        "action_taken": "Replaced 1kg concentrate with DORB and added trough shade cloth.",
        "actual_cost_inr": 4820.0,
        "observed_milk_change_litres": 12.5,
        "farmer_notes": "Cows drank significantly more water once troughs were shaded. Milk improved by 12.5L.",
        "outcome_rating": 5
    }
    res_outcome = client.post(f"/api/decisions/{decision_id}/outcome", json=outcome_payload)
    assert res_outcome.status_code == 200
    assert res_outcome.json()["decision_id"] == decision_id

    # Verify outcome reflected in history
    res_hist2 = client.get("/api/decisions")
    d_updated = next(d for d in res_hist2.json()["decisions"] if d["decision_id"] == decision_id)
    assert d_updated["status"] == "outcome_recorded"
    assert len(d_updated["outcomes"]) == 1
    assert d_updated["outcomes"][0]["observed_milk_change_litres"] == 12.5

def test_api_veterinary_assessments(client: TestClient):
    response = client.get("/api/veterinary/assessments?farm_id=demo-farm-01")
    assert response.status_code == 200
    data = response.json()
    assert "Merck Veterinary Manual" in data["reference_standard"]
    assert data["total_assessed"] >= 2
    # Verify KA-MAN-104 critical triage
    ka_104 = next((a for a in data["assessments"] if a["animal_tag"] == "KA-MAN-104"), None)
    assert ka_104 is not None
    assert "Critical" in ka_104["urgency_level"]
    assert ka_104["veterinary_escalation"] is True

    # Verify KA-MAN-112 normal HR but prompt mastitis review
    ka_112 = next((a for a in data["assessments"] if a["animal_tag"] == "KA-MAN-112"), None)
    assert ka_112 is not None
    assert ka_112["veterinary_escalation"] is True
    # Confirm heart rate is evaluated as normal (48-84)
    hr_item = next(v for v in ka_112["vital_signs_table"] if v["name"] == "Heart Rate")
    assert hr_item["status"] == "Normal"
    assert hr_item["observed_value"] == 76.0

