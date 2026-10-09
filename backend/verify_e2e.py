import json
import sys
from fastapi.testclient import TestClient
from app.main import app

def run_e2e():
    client = TestClient(app)

    print("=== 1. Testing GET /api/health ===")
    r = client.get("/api/health")
    assert r.status_code == 200, r.text
    health = r.json()
    print("Health Status:", json.dumps(health, indent=2))
    assert health["status"] == "healthy"
    assert health["data_mode"] == "synthetic_demo"

    print("\n=== 2. Testing GET /api/dashboard ===")
    r = client.get("/api/dashboard?farm_id=demo-farm-01")
    assert r.status_code == 200, r.text
    dash = r.json()
    print(f"Farm Name: {dash['farm_name']}")
    print(f"Location: {dash['location']}")
    print(f"Animal Count: {dash['animal_count']}")
    print(f"Daily Milk: {dash['daily_production']['current_litres']} L (baseline: {dash['daily_production']['baseline_litres']} L)")
    print(f"THI Index: {dash['environmental_conditions']['thi_index']} ({dash['environmental_conditions']['heat_stress_category']})")
    assert dash["animal_count"] == 24
    assert dash["daily_production"]["current_litres"] == 410.0

    print("\n=== 3. Testing GET /api/feeds ===")
    r = client.get("/api/feeds")
    assert r.status_code == 200, r.text
    feeds_data = r.json()
    print(f"Total Feeds in Catalog: {feeds_data['total_feeds']}")
    assert feeds_data["total_feeds"] >= 7

    print("\n=== 4. Testing POST /api/decision/analyze (Prompt Test) ===")
    prompt = "My dairy farm's milk production has declined, feed prices have increased, and the weather is hot. I have ₹5,000 available. Compare possible actions and recommend a practical strategy."
    payload = {
        "query": prompt,
        "farm_id": "demo-farm-01",
        "budget_inr": 5000,
        "farmer_strategy": "Reduce concentrate feed and increase green fodder",
        "priorities": {
            "profitability": 0.7,
            "low_cost": 0.8,
            "animal_welfare": 1.0,
            "risk_tolerance": 0.6,
            "operational_ease": 0.8
        }
    }
    r = client.post("/api/decision/analyze", json=payload)
    assert r.status_code == 200, r.text
    analysis = r.json()
    decision_id = analysis["decision_id"]
    print(f"Decision ID: {decision_id}")
    print(f"Selected Agents: {analysis['selected_agents']}")
    print(f"Total Candidate Strategies: {len(analysis['candidate_strategies'])}")
    for strat in analysis["candidate_strategies"]:
        print(f"  • [{strat['strategy_id']}] {strat['name']} (Cost: Rs.{strat['estimated_daily_cost_inr']}, Score: {strat['scores']['weighted_total']})")
    print(f"Recommended Winner: {analysis['recommended_strategy_id']}")
    print(f"Explanation: {analysis['explanation']['winner_name']} - {analysis['explanation']['why_recommended'][:120]}...")
    assert len(analysis["candidate_strategies"]) >= 2
    assert analysis["recommended_strategy_id"] is not None

    print("\n=== 5. Testing POST /api/decision/simulate ===")
    sim_payload = {
        "feed_a_id": "feed-conc-01",
        "feed_b_id": "feed-dorb-01",
        "substitution_percentage": 25,
        "animal_count": 24,
        "milk_sale_price_inr": 38.0,
        "intervention_cost_inr": 130.0,
        "budget_inr": 5000.0
    }
    r = client.post("/api/decision/simulate", json=sim_payload)
    assert r.status_code == 200, r.text
    sim = r.json()
    print(f"Daily Cost Difference: Rs.{sim['cost_difference_daily_inr']}")
    print(f"Daily Margin Difference: Rs.{sim['margin_difference_daily_inr']}")
    print(f"Total Daily Cost: Rs.{sim['alternative_scenario']['total_cost_inr']} vs Budget Rs.{sim['budget_inr']}")
    print(f"Within Rs.5000 Budget: {sim['eligible_under_budget']}")
    assert sim["eligible_under_budget"] is False  # 5089 > 5000 accurately detected!

    # Test with Rs.6000 budget
    sim_payload["budget_inr"] = 6000.0
    r2 = client.post("/api/decision/simulate", json=sim_payload)
    assert r2.status_code == 200
    assert r2.json()["eligible_under_budget"] is True
    print(f"Within Rs.6000 Budget: True (Compliant)")

    print("\n=== 6. Testing GET /api/decisions ===")
    r = client.get("/api/decisions")
    assert r.status_code == 200, r.text
    dec_list = r.json()
    print(f"Logged Decisions: {dec_list['total_decisions']}")
    assert dec_list["total_decisions"] >= 1

    print("\n=== 7. Testing POST /api/decisions (Save Selection) ===")
    save_payload = {
        "decision_id": decision_id,
        "farm_id": "demo-farm-01",
        "selected_strategy_id": analysis["recommended_strategy_id"],
        "farmer_notes": "Selected the recommended blended diet + water shading intervention."
    }
    r = client.post("/api/decisions", json=save_payload)
    assert r.status_code == 200, r.text
    print(f"Saved: {r.json()['status']} - Strategy: {r.json()['selected_strategy_id']}")

    print("\n=== 8. Testing POST /api/decisions/{decision_id}/outcome ===")
    outcome_payload = {
        "action_taken": "Adopted 25% DORB blend + sprinkler cooling array",
        "actual_cost_inr": 4820.0,
        "observed_milk_change_litres": 18.0,
        "farmer_notes": "Milk production recovered 18 L/day within 48 hours without acidosis.",
        "outcome_rating": 5
    }
    r = client.post(f"/api/decisions/{decision_id}/outcome", json=outcome_payload)
    assert r.status_code == 200, r.text
    print(f"Outcome Logged: ID #{r.json()['outcome_id']} for decision {r.json()['decision_id']}")

    print("\n=======================================================")
    print("SUCCESS: ALL 8 ENDPOINTS VERIFIED & VALIDATED END-TO-END!")
    print("=======================================================")

if __name__ == "__main__":
    run_e2e()
