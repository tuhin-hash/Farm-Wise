"""Tests for fallback behavior without LLM credentials."""
import os
import pytest
from app.services.llm_service import is_llm_available, get_mode, llm_interpret
from app.graph.workflow import run_farmwise_workflow
from app.graph.state import FarmWiseState


def test_fallback_mode_without_credentials(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    assert is_llm_available() is False
    assert get_mode() == "demo"
    # llm_interpret should return default fallback string
    fallback = llm_interpret("Hello LLM", fallback="deterministic fallback")
    assert fallback == "deterministic fallback"


def test_full_workflow_runs_in_fallback_mode(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    state: FarmWiseState = {
        "decision_id": "test-fallback-01",
        "query": "Milk production dropped and feed prices are high",
        "farm_id": "demo-farm-01",
        "budget_inr": 5000.0,
        "farmer_strategy": "Cut concentrate by half",
        "priorities": {"low_cost": 0.8, "animal_welfare": 0.9},
        "execution_trace": [],
        "agent_results": {},
    }
    result = run_farmwise_workflow(state)
    assert "strategies" in result
    assert len(result["strategies"]) >= 4
    assert result["recommended_strategy_id"] != ""
    assert result["recommendation_explanation"] != ""
    assert len(result["execution_trace"]) >= 5
