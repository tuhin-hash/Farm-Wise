"""Tests for SQLite decision history persistence and outcome recording."""
import pytest
import uuid
from app.db.database import init_db
from app.models.requests import SaveDecisionRequest, RecordOutcomeRequest
from app.services.decision_service import save_decision, record_outcome, list_decisions


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_save_and_retrieve_decision():
    dec_id = f"test-dec-{uuid.uuid4().hex[:6]}"
    req = SaveDecisionRequest(
        decision_id=dec_id,
        query="Test query for saving",
        farm_id="demo-farm-01",
        selected_strategy_id="strategy-feed",
        selected_strategy_name="Feed Adjustment Strategy",
        analysis_summary="Summary of test analysis",
        farmer_notes="Decided to test on 5 cows first",
    )
    saved = save_decision(req)
    assert saved.decision_id == dec_id
    assert saved.selected_strategy_id == "strategy-feed"

    # Fetch list
    history = list_decisions("demo-farm-01")
    matching = [d for d in history.decisions if d.decision_id == dec_id]
    assert len(matching) == 1
    assert matching[0].farmer_notes == "Decided to test on 5 cows first"


def test_record_outcome():
    dec_id = f"test-dec-{uuid.uuid4().hex[:6]}"
    req = SaveDecisionRequest(
        decision_id=dec_id,
        query="Testing outcome record",
        farm_id="demo-farm-01",
        selected_strategy_id="strategy-cooling",
        selected_strategy_name="Cooling Strategy",
        analysis_summary="Cooling tested",
    )
    save_decision(req)

    outcome_req = RecordOutcomeRequest(
        actual_result="Milk production stabilized after 5 days of fan cooling.",
        milk_change_litres=12.0,
        cost_change_inr=800.0,
        satisfaction=4,
        notes="Helped noticeably during afternoon heat.",
    )
    res = record_outcome(dec_id, outcome_req)
    assert res["status"] == "success"
    assert "FarmWise does not claim automatic learning" in res["message"]

    # History should now include outcome
    history = list_decisions("demo-farm-01")
    matching = [d for d in history.decisions if d.decision_id == dec_id]
    assert len(matching) == 1
    assert matching[0].outcome is not None
    assert matching[0].outcome["satisfaction"] == 4
