"""Tests for conditional agent routing and intent detection."""
import pytest
from app.agents.orchestrator import run as run_orchestrator


def test_feed_price_intent_routes_conditionally():
    """Feed price queries should route to nutrition and finance, without health analysis."""
    result = run_orchestrator("Soybean meal price is too expensive. What alternative feed should I buy?", farm_id="demo-farm-01")
    required = result["findings"]["required_agents"]
    
    assert "nutrition" in required
    assert "finance" in required
    assert "decision" in required
    # risk_environment should not be required for purely feed cost query
    assert "risk_environment" not in required


def test_production_decline_intent_routes_all_agents():
    """Production drop queries require full analysis across farm data, nutrition, risk, and finance."""
    result = run_orchestrator("Milk yield has dropped drastically over the last 10 days.", farm_id="demo-farm-01")
    required = result["findings"]["required_agents"]
    
    assert "farm_data" in required
    assert "nutrition" in required
    assert "risk_environment" in required
    assert "finance" in required
    assert "decision" in required


def test_animal_health_intent_routing():
    """Sick cow / health queries route to risk and farm data."""
    result = run_orchestrator("One cow is sick and lame, appetite is low", farm_id="demo-farm-01")
    required = result["findings"]["required_agents"]
    
    assert "risk_environment" in required
    assert "farm_data" in required
    assert "decision" in required
    assert "nutrition" not in required
