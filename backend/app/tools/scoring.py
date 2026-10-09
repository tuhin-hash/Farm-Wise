"""Deterministic scoring engine for the Decision Arena.

Scores strategies on multiple criteria, applies farmer priority weights,
and produces a transparent, reproducible ranking.

Score components (each 0-100):
  - affordability:    How cheap is this relative to budget?
  - animal_welfare:   Does this protect animal health?
  - financial_impact: Revenue/margin benefit?
  - risk:             Lower risk = higher score.
  - feasibility:      How easy to implement?

Farmer priorities (0.0-1.0) weight each component. The total score is
a weighted sum normalised by the sum of weights.
"""
from __future__ import annotations

from typing import Dict, List, Any, Optional


# --- Raw score helpers (all return 0-100) ---

def score_affordability(daily_cost_inr: float, budget_inr: float) -> float:
    """Higher score = more affordable. 0 if exceeds budget by 2x+."""
    if budget_inr <= 0:
        return 50.0
    ratio = daily_cost_inr / budget_inr
    if ratio <= 0.5:
        return 100.0
    elif ratio <= 1.0:
        return round(100 - (ratio - 0.5) * 100, 1)
    elif ratio <= 2.0:
        return round(50 - (ratio - 1.0) * 50, 1)
    return 0.0


def score_animal_welfare(risk_level: str, requires_vet: bool) -> float:
    """Higher score = better welfare. Vet-required situations reduce score."""
    base = {"low": 90.0, "medium": 60.0, "high": 30.0}.get(risk_level, 50.0)
    if requires_vet:
        base = min(base, 50.0)
    return base


def score_financial_impact(
    margin_inr: Optional[float],
    baseline_margin_inr: float,
) -> float:
    """Higher score = better financial outcome vs baseline."""
    if margin_inr is None:
        return 50.0  # unknown
    if baseline_margin_inr <= 0:
        return 70.0 if margin_inr > 0 else 30.0
    improvement_pct = ((margin_inr - baseline_margin_inr) / abs(baseline_margin_inr)) * 100
    # Map -50% to 0, 0% to 50, +50% to 100
    return round(max(0, min(100, 50 + improvement_pct)), 1)


def score_risk(risk_level: str) -> float:
    """Higher score = lower risk."""
    return {"low": 90.0, "medium": 55.0, "high": 20.0}.get(risk_level, 40.0)


def score_feasibility(feasibility: str) -> float:
    """Higher score = easier to implement."""
    return {"easy": 90.0, "moderate": 60.0, "difficult": 30.0}.get(feasibility, 50.0)


# --- Strategy Scoring ---

def score_strategy(
    strategy: Dict[str, Any],
    budget_inr: float,
    baseline_margin_inr: float,
    priorities: Dict[str, float],
) -> Dict[str, Any]:
    """Score a single strategy against all criteria with farmer priorities.

    Returns raw scores, weighted scores, total score and any disqualification.
    """
    cost_to_evaluate = strategy["estimated_daily_cost_inr"]
    if strategy.get("within_budget", True) and budget_inr > 0 and cost_to_evaluate > budget_inr:
        # Budget was specified as an intervention budget; scale appropriately
        eff_budget = max(budget_inr, cost_to_evaluate * 1.2)
        affordability = score_affordability(cost_to_evaluate, eff_budget)
    else:
        affordability = score_affordability(cost_to_evaluate, budget_inr)

    raw = {
        "affordability": affordability,
        "animal_welfare": score_animal_welfare(
            strategy["risk_level"],
            strategy.get("requires_vet_confirmation", False),
        ),
        "financial_impact": score_financial_impact(
            strategy.get("estimated_daily_margin_inr"),
            baseline_margin_inr,
        ),
        "risk": score_risk(strategy["risk_level"]),
        "feasibility": score_feasibility(strategy["feasibility"]),
    }

    # Map priority keys to score keys
    priority_map = {
        "profitability": "financial_impact",
        "low_cost": "affordability",
        "animal_welfare": "animal_welfare",
        "risk_reduction": "risk",
    }
    # Always include feasibility with a base weight
    weights = {"feasibility": 0.4}
    for pk, sk in priority_map.items():
        weights[sk] = priorities.get(pk, 0.5)

    weighted = {}
    total_weight = sum(weights.values())
    for key, raw_score in raw.items():
        w = weights.get(key, 0.3)
        weighted[key] = round(raw_score * w, 2)

    total_weighted = sum(weighted.values())
    total_score = round(total_weighted / total_weight, 2) if total_weight > 0 else 0.0

    # Check disqualification
    disqualified = False
    disqualification_reason = None

    if not strategy.get("within_budget", True):
        disqualified = True
        disqualification_reason = f"Exceeds budget (cost ₹{strategy['estimated_daily_cost_inr']} > budget ₹{budget_inr})"

    if strategy.get("risk_level") == "high" and priorities.get("animal_welfare", 0.5) >= 0.9:
        disqualified = True
        disqualification_reason = "High risk with animal welfare as top priority"

    return {
        "strategy_id": strategy["strategy_id"],
        "strategy_name": strategy["name"],
        "raw_scores": raw,
        "weighted_scores": weighted,
        "total_score": total_score,
        "disqualified": disqualified,
        "disqualification_reason": disqualification_reason,
    }


def rank_strategies(
    strategies: List[Dict[str, Any]],
    budget_inr: float,
    baseline_margin_inr: float,
    priorities: Dict[str, float],
) -> List[Dict[str, Any]]:
    """Score and rank all strategies. Returns scored list sorted by rank."""
    scored = []
    for s in strategies:
        result = score_strategy(s, budget_inr, baseline_margin_inr, priorities)
        scored.append(result)

    # Sort: non-disqualified first (by score desc), then disqualified
    eligible = [s for s in scored if not s["disqualified"]]
    disqualified = [s for s in scored if s["disqualified"]]

    eligible.sort(key=lambda x: x["total_score"], reverse=True)
    disqualified.sort(key=lambda x: x["total_score"], reverse=True)

    ranked = eligible + disqualified
    for i, s in enumerate(ranked):
        s["rank"] = i + 1

    return ranked


def explain_ranking(
    ranked: List[Dict[str, Any]],
    priorities: Dict[str, float],
) -> str:
    """Generate a human-readable explanation of the ranking."""
    if not ranked:
        return "No strategies were evaluated."

    winner = ranked[0]
    if winner["disqualified"]:
        return (
            f"All strategies were disqualified. The top-ranked is "
            f"'{winner['strategy_name']}' (score {winner['total_score']}) but it was "
            f"disqualified because: {winner['disqualification_reason']}. "
            f"Consider adjusting your budget or priorities."
        )

    # Find the top priority
    top_priority = max(priorities, key=priorities.get) if priorities else "balanced"
    priority_label = {
        "profitability": "profitability",
        "low_cost": "cost savings",
        "animal_welfare": "animal welfare",
        "risk_reduction": "risk reduction",
    }.get(top_priority, top_priority)

    parts = [
        f"'{winner['strategy_name']}' is recommended (score: {winner['total_score']}/100).",
        f"Given your emphasis on {priority_label}, this strategy scored highest overall.",
    ]

    # Explain why runner-up lost
    if len(ranked) > 1:
        runner = ranked[1]
        if runner["disqualified"]:
            parts.append(
                f"'{runner['strategy_name']}' was disqualified: {runner['disqualification_reason']}."
            )
        else:
            diff = round(winner["total_score"] - runner["total_score"], 1)
            parts.append(
                f"'{runner['strategy_name']}' (score: {runner['total_score']}) "
                f"ranked second, {diff} points behind."
            )
            # Find the criteria where winner beat runner-up most
            best_gap_key = None
            best_gap = -999
            for key in winner["raw_scores"]:
                gap = winner["raw_scores"][key] - runner["raw_scores"][key]
                if gap > best_gap:
                    best_gap = gap
                    best_gap_key = key
            if best_gap_key and best_gap > 0:
                parts.append(
                    f"The main advantage was in {best_gap_key.replace('_', ' ')} "
                    f"({winner['raw_scores'][best_gap_key]} vs {runner['raw_scores'][best_gap_key]})."
                )

    return " ".join(parts)
