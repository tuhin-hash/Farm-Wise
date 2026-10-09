"""Transparent, deterministic multi-criteria decision scoring engine.
Keeps raw financial metrics separate from preference-weighted scores.
Rejects strategies violating hard constraints (e.g. daily budget).
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ScoringBreakdown(BaseModel):
    affordability_score: float = Field(..., description="0-100 score on cost efficiency relative to budget")
    animal_welfare_score: float = Field(..., description="0-100 score on hydration, health, and comfort")
    financial_impact_score: float = Field(..., description="0-100 score on net margin and profitability")
    risk_score: float = Field(..., description="0-100 score where higher represents safer/lower risk")
    feasibility_score: float = Field(..., description="0-100 score on operational ease of farm implementation")
    weighted_total: float = Field(..., description="Priority-weighted final score (0-100)")
    weights_applied: Dict[str, float] = Field(..., description="Farmer weights applied during ranking")
    scoring_formula: str = Field(..., description="Mathematical explanation of the scoring calculation")

class StrategyEvaluation(BaseModel):
    strategy_id: str
    name: str
    description: str
    estimated_daily_cost_inr: float
    estimated_daily_revenue_inr: Optional[float] = None
    estimated_daily_margin_inr: Optional[float] = None
    relative_risk_level: str  # "low", "medium", "high"
    operational_feasibility: str  # "easy", "moderate", "challenging"
    expected_impact: str
    advantages: List[str]
    drawbacks: List[str]
    evidence_supporting: List[str]
    assumptions: List[str]
    missing_information: List[str]
    veterinary_confirmation_required: bool
    veterinary_confirmation_details: Optional[str] = None
    eligible: bool = True
    ineligibility_reason: Optional[str] = None
    scores: ScoringBreakdown

def evaluate_strategy_affordability(daily_cost_inr: float, budget_inr: float) -> tuple[float, bool, Optional[str]]:
    """Calculates affordability score and validates hard budget constraint."""
    if budget_inr <= 0:
        return 50.0, True, None

    if daily_cost_inr > budget_inr:
        overage = daily_cost_inr - budget_inr
        return 0.0, False, f"Hard Constraint Violated: Daily expenditure of ₹{daily_cost_inr:.2f} exceeds available budget of ₹{budget_inr:.2f} by ₹{overage:.2f}."

    # Within budget: score ranges from 50 (at 100% of budget) to 100 (at 0 cost)
    ratio = daily_cost_inr / budget_inr
    affordability = round(100.0 - (ratio * 40.0), 1)
    return max(0.0, min(100.0, affordability)), True, None

def risk_level_to_score(risk_level: str) -> float:
    """Converts categorical risk to 0-100 score where higher is safer."""
    lvl = (risk_level or "").lower()
    if lvl == "low":
        return 90.0
    elif lvl == "medium":
        return 65.0
    elif lvl == "high":
        return 35.0
    return 50.0

def feasibility_level_to_score(feasibility_level: str) -> float:
    """Converts operational feasibility to 0-100 score."""
    lvl = (feasibility_level or "").lower()
    if lvl == "easy":
        return 90.0
    elif lvl == "moderate":
        return 72.0
    elif lvl == "challenging":
        return 45.0
    return 60.0

def score_and_rank_strategies(
    strategies_raw: List[Dict[str, Any]],
    budget_inr: float,
    priorities: Dict[str, float]
) -> List[StrategyEvaluation]:
    """Calculates deterministic scores for all candidate strategies and sorts them in descending order of weighted score.
    Ineligible strategies (e.g. over-budget) are placed at the bottom.
    """
    # Normalized weights
    w_cost = max(0.0, float(priorities.get("low_cost", 0.5)))
    w_welfare = max(0.0, float(priorities.get("animal_welfare", 0.5)))
    w_profit = max(0.0, float(priorities.get("profitability", 0.5)))
    w_risk = max(0.0, float(priorities.get("risk_reduction", 0.5)))
    w_feas = max(0.0, float(priorities.get("operational_feasibility", 0.4)))

    total_weight = w_cost + w_welfare + w_profit + w_risk + w_feas
    if total_weight <= 0:
        total_weight = 1.0

    evaluated_list: List[StrategyEvaluation] = []

    for strat in strategies_raw:
        cost = float(strat.get("estimated_daily_cost_inr", 0.0))
        afford_score, eligible, ineligibility_reason = evaluate_strategy_affordability(cost, budget_inr)

        # Welfare score
        welfare_score = float(strat.get("raw_welfare_score", 60.0))

        # Financial impact score based on margin
        margin = float(strat.get("estimated_daily_margin_inr", 0.0))
        # Benchmark margin: ₹10,000/day = 70. Every ₹1000 above or below adjusts by 5 points
        finance_score = min(100.0, max(10.0, round(70.0 + ((margin - 10000.0) / 1000.0 * 5.0), 1)))

        # Risk score
        risk_score = risk_level_to_score(strat.get("relative_risk_level", "medium"))

        # Feasibility score
        feas_score = feasibility_level_to_score(strat.get("operational_feasibility", "moderate"))

        if not eligible:
            weighted_total = 0.0
        else:
            weighted_total = round(
                (
                    (w_cost * afford_score) +
                    (w_welfare * welfare_score) +
                    (w_profit * finance_score) +
                    (w_risk * risk_score) +
                    (w_feas * feas_score)
                ) / total_weight,
                2
            )

        formula_desc = (
            f"Weighted Total = (({w_cost:.2f} * {afford_score:.1f} [Affordability]) + "
            f"({w_welfare:.2f} * {welfare_score:.1f} [Welfare]) + "
            f"({w_profit:.2f} * {finance_score:.1f} [Financial]) + "
            f"({w_risk:.2f} * {risk_score:.1f} [Risk]) + "
            f"({w_feas:.2f} * {feas_score:.1f} [Feasibility])) / {total_weight:.2f} = {weighted_total:.2f}"
        )

        breakdown = ScoringBreakdown(
            affordability_score=afford_score,
            animal_welfare_score=welfare_score,
            financial_impact_score=finance_score,
            risk_score=risk_score,
            feasibility_score=feas_score,
            weighted_total=weighted_total,
            weights_applied={
                "low_cost": w_cost,
                "animal_welfare": w_welfare,
                "profitability": w_profit,
                "risk_reduction": w_risk,
                "operational_feasibility": w_feas
            },
            scoring_formula=formula_desc
        )

        evaluated = StrategyEvaluation(
            strategy_id=strat.get("id", ""),
            name=strat.get("name", ""),
            description=strat.get("description", ""),
            estimated_daily_cost_inr=cost,
            estimated_daily_revenue_inr=strat.get("estimated_daily_revenue_inr"),
            estimated_daily_margin_inr=strat.get("estimated_daily_margin_inr"),
            relative_risk_level=strat.get("relative_risk_level", "medium"),
            operational_feasibility=strat.get("operational_feasibility", "moderate"),
            expected_impact=strat.get("expected_impact", ""),
            advantages=strat.get("advantages", []),
            drawbacks=strat.get("drawbacks", []),
            evidence_supporting=strat.get("evidence_supporting", []),
            assumptions=strat.get("assumptions", []),
            missing_information=strat.get("missing_information", []),
            veterinary_confirmation_required=bool(strat.get("veterinary_confirmation_required", False)),
            veterinary_confirmation_details=strat.get("veterinary_confirmation_details"),
            eligible=eligible,
            ineligibility_reason=ineligibility_reason,
            scores=breakdown
        )
        evaluated_list.append(evaluated)

    # Sort: Eligible first, then descending by weighted_total
    evaluated_list.sort(key=lambda s: (1 if s.eligible else 0, s.scores.weighted_total), reverse=True)
    return evaluated_list
