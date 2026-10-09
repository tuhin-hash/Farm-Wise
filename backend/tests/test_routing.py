import pytest
from app.agents.orchestrator import orchestrator_agent

def test_feed_price_query_conditional_routing():
    """A pure feed price query routes conditionally, skipping farm_data and risk_environment."""
    query = "Commercial concentrate feed prices are rising rapidly. What alternative grain should I buy?"
    plan = orchestrator_agent.plan_and_route(query)

    assert plan["intent"] == "FEED_OPTIMIZATION"
    assert "nutrition" in plan["selected_agents"]
    assert "finance" in plan["selected_agents"]
    assert "decision" in plan["selected_agents"]
    # Should skip health/herd data agents
    assert "farm_data" not in plan["selected_agents"]
    assert "risk_environment" not in plan["selected_agents"]

def test_production_decline_query_holistic_routing():
    """A production drop or heat stress query routes to the full suite of agents."""
    query = "Milk production dropped by 35 litres and weather is hot. Should I change feed or add cooling?"
    plan = orchestrator_agent.plan_and_route(query)

    assert plan["intent"] == "PRODUCTION_DECLINE_AND_STRESS"
    assert "orchestrator" in plan["selected_agents"]
    assert "farm_data" in plan["selected_agents"]
    assert "risk_environment" in plan["selected_agents"]
    assert "nutrition" in plan["selected_agents"]
    assert "finance" in plan["selected_agents"]
    assert "decision" in plan["selected_agents"]
