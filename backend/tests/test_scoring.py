import pytest
from app.tools.scoring import score_and_rank_strategies

def test_hard_budget_constraint_enforcement():
    strategies_raw = [
        {
            "id": "strat-cheap",
            "name": "Within Budget Strategy",
            "estimated_daily_cost_inr": 4500.0,
            "estimated_daily_margin_inr": 11000.0,
            "relative_risk_level": "low",
            "operational_feasibility": "easy",
            "raw_welfare_score": 75.0
        },
        {
            "id": "strat-expensive",
            "name": "Over Budget Strategy",
            "estimated_daily_cost_inr": 5600.0,
            "estimated_daily_margin_inr": 11500.0,
            "relative_risk_level": "low",
            "operational_feasibility": "moderate",
            "raw_welfare_score": 95.0
        }
    ]

    budget = 5000.0
    priorities = {"low_cost": 0.5, "animal_welfare": 0.8, "profitability": 0.8, "risk_reduction": 0.8}

    ranked = score_and_rank_strategies(strategies_raw, budget_inr=budget, priorities=priorities)

    # Within budget strategy must be eligible
    strat_cheap = next(s for s in ranked if s.strategy_id == "strat-cheap")
    assert strat_cheap.eligible is True
    assert strat_cheap.ineligibility_reason is None

    # Over budget strategy must be rejected
    strat_exp = next(s for s in ranked if s.strategy_id == "strat-expensive")
    assert strat_exp.eligible is False
    assert "Hard Constraint Violated" in strat_exp.ineligibility_reason
    assert strat_exp.scores.weighted_total == 0.0

    # Top winner must be the eligible strategy
    assert ranked[0].strategy_id == "strat-cheap"

def test_farmer_priority_weighting_sensitivity():
    """Verify that changing farmer priorities changes the ranking order."""
    strategies_raw = [
        {
            "id": "strat-low-cost",
            "name": "Extreme Budget Cut",
            "estimated_daily_cost_inr": 3800.0,
            "estimated_daily_margin_inr": 10200.0,
            "relative_risk_level": "high",
            "operational_feasibility": "easy",
            "raw_welfare_score": 40.0
        },
        {
            "id": "strat-high-welfare",
            "name": "Welfare & Heat Relief",
            "estimated_daily_cost_inr": 4900.0,
            "estimated_daily_margin_inr": 11400.0,
            "relative_risk_level": "low",
            "operational_feasibility": "moderate",
            "raw_welfare_score": 90.0
        }
    ]

    budget = 5000.0

    # Case 1: Farmer heavily prioritizes low cost and does not care about welfare/risk
    cost_focused_priorities = {
        "low_cost": 1.0,
        "animal_welfare": 0.1,
        "profitability": 0.2,
        "risk_reduction": 0.1,
        "operational_feasibility": 0.5
    }
    ranked_cost = score_and_rank_strategies(strategies_raw, budget_inr=budget, priorities=cost_focused_priorities)
    assert ranked_cost[0].strategy_id == "strat-low-cost"

    # Case 2: Farmer heavily prioritizes animal welfare and risk reduction
    welfare_focused_priorities = {
        "low_cost": 0.1,
        "animal_welfare": 1.0,
        "profitability": 0.5,
        "risk_reduction": 1.0,
        "operational_feasibility": 0.5
    }
    ranked_welfare = score_and_rank_strategies(strategies_raw, budget_inr=budget, priorities=welfare_focused_priorities)
    assert ranked_welfare[0].strategy_id == "strat-high-welfare"
