"""Tests for Decision Arena scoring, priority sensitivity, and disqualification rules."""
import pytest
from app.tools.scoring import (
    score_affordability,
    score_animal_welfare,
    score_risk,
    score_strategy,
    rank_strategies,
    explain_ranking,
)


def test_affordability_scoring():
    # Cost well below budget -> high score
    assert score_affordability(daily_cost_inr=2000, budget_inr=5000) == 100.0
    # Cost equal to budget -> 50
    assert score_affordability(daily_cost_inr=5000, budget_inr=5000) == 50.0
    # Cost exceeding budget by 2x -> 0
    assert score_affordability(daily_cost_inr=11000, budget_inr=5000) == 0.0


def test_priority_changes_ranking():
    """Verify that different farmer priorities change the winning recommendation."""
    strat_cheap = {
        "strategy_id": "s-cheap",
        "name": "Cheap Low-Cost Plan",
        "estimated_daily_cost_inr": 2000.0,
        "estimated_daily_margin_inr": 3000.0,
        "risk_level": "medium",
        "feasibility": "easy",
        "within_budget": True,
        "requires_vet_confirmation": False,
    }
    strat_welfare = {
        "strategy_id": "s-welfare",
        "name": "High-Welfare Plan",
        "estimated_daily_cost_inr": 4800.0,
        "estimated_daily_margin_inr": 4000.0,
        "risk_level": "low",
        "feasibility": "moderate",
        "within_budget": True,
        "requires_vet_confirmation": False,
    }

    strategies = [strat_cheap, strat_welfare]

    # When priority is low_cost, s-cheap should win
    priorities_cost = {
        "profitability": 0.2,
        "low_cost": 1.0,
        "animal_welfare": 0.1,
        "risk_reduction": 0.1,
    }
    ranked_cost = rank_strategies(strategies, budget_inr=5000, baseline_margin_inr=2500, priorities=priorities_cost)
    assert ranked_cost[0]["strategy_id"] == "s-cheap"

    # When priority is animal_welfare & risk_reduction, s-welfare should win
    priorities_welfare = {
        "profitability": 0.2,
        "low_cost": 0.1,
        "animal_welfare": 1.0,
        "risk_reduction": 1.0,
    }
    ranked_welfare = rank_strategies(strategies, budget_inr=5000, baseline_margin_inr=2500, priorities=priorities_welfare)
    assert ranked_welfare[0]["strategy_id"] == "s-welfare"


def test_budget_disqualification():
    """Strategy exceeding budget must be disqualified."""
    strat_over_budget = {
        "strategy_id": "s-over",
        "name": "Over Budget Plan",
        "estimated_daily_cost_inr": 6000.0,
        "estimated_daily_margin_inr": 5000.0,
        "risk_level": "low",
        "feasibility": "easy",
        "within_budget": False,  # Exceeds budget
    }
    strat_valid = {
        "strategy_id": "s-valid",
        "name": "Valid Plan",
        "estimated_daily_cost_inr": 3000.0,
        "estimated_daily_margin_inr": 2000.0,
        "risk_level": "medium",
        "feasibility": "easy",
        "within_budget": True,
    }

    ranked = rank_strategies(
        [strat_over_budget, strat_valid],
        budget_inr=5000,
        baseline_margin_inr=2000,
        priorities={"low_cost": 0.5, "animal_welfare": 0.5},
    )
    # strat_valid must be ranked #1
    assert ranked[0]["strategy_id"] == "s-valid"
    assert ranked[1]["disqualified"] is True
    assert "Exceeds budget" in ranked[1]["disqualification_reason"]
