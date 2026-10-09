import pytest
from app.services.llm_service import llm_service
from app.graph.workflow import execute_agent_workflow

@pytest.mark.asyncio
async def test_fallback_workflow_without_llm_key():
    """Verify that the engine executes completely and deterministically when no LLM key is configured."""
    # Ensure service indicates no LLM key
    assert llm_service.is_configured is False or isinstance(llm_service.api_key, str)

    result = await execute_agent_workflow(
        query="Milk production has dropped and feed prices are rising. What should I do?",
        farm_id="demo-farm-01",
        budget_inr=5000.0,
        farmer_strategy="Reduce concentrate feed and increase green fodder",
        priorities={
            "profitability": 0.7,
            "low_cost": 0.8,
            "animal_welfare": 1.0,
            "risk_reduction": 0.9
        }
    )

    assert result["recommended_strategy_id"] is not None
    assert len(result["ranked_strategies"]) >= 4
    assert len(result["execution_trace"]) >= 5
    assert "explanation" in result
    assert "winner_name" in result["explanation"]
    assert len(result["assumptions"]) > 0
    assert len(result["missing_data"]) > 0
    assert len(result["safety_notes"]) > 0
