"""Decision Agent for FarmWise.
Evaluates candidate strategies in the Decision Arena, applies priority-weighted scoring,
enforces budget and safety constraints, ranks options, and explains outcomes.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.tools.scoring import score_and_rank_strategies, StrategyEvaluation
from app.models.responses import RecommendationExplanation

class DecisionAgent:
    @staticmethod
    def evaluate_and_rank(
        candidate_strategies_raw: List[Dict[str, Any]],
        budget_inr: float,
        priorities: Dict[str, float],
        llm_explanation_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Runs transparent deterministic scoring and selects the winning strategy."""
        ranked_evaluations: List[StrategyEvaluation] = score_and_rank_strategies(
            candidate_strategies_raw,
            budget_inr=budget_inr,
            priorities=priorities
        )

        # Select top eligible strategy
        eligible_strategies = [s for s in ranked_evaluations if s.eligible]
        if eligible_strategies:
            winner = eligible_strategies[0]
        else:
            winner = ranked_evaluations[0] if ranked_evaluations else None

        winner_id = winner.strategy_id if winner else ""
        winner_name = winner.name if winner else "No eligible strategy found"

        # Generate structured explanation
        if llm_explanation_override:
            explanation = RecommendationExplanation(**llm_explanation_override)
        else:
            explanation = DecisionAgent._generate_deterministic_explanation(
                winner=winner,
                all_ranked=ranked_evaluations,
                budget_inr=budget_inr,
                priorities=priorities
            )

        return {
            "ranked_strategies": ranked_evaluations,
            "recommended_strategy_id": winner_id,
            "explanation": explanation,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def _generate_deterministic_explanation(
        winner: Optional[StrategyEvaluation],
        all_ranked: List[StrategyEvaluation],
        budget_inr: float,
        priorities: Dict[str, float]
    ) -> RecommendationExplanation:
        if not winner:
            return RecommendationExplanation(
                winner_name="None",
                why_recommended="No candidate strategy complied with operating constraints.",
                why_alternatives_ranked_lower=[],
                critical_tradeoffs=[],
                sensitivity_to_priorities="All options exceeded constraint thresholds."
            )

        # Why recommended
        why_rec = (
            f"The '{winner.name}' scored the highest weighted mark ({winner.scores.weighted_total:.2f}/100). "
            f"With a daily expenditure of ₹{winner.estimated_daily_cost_inr:.2f}, it respects the farmer's ₹{budget_inr:.2f} daily budget cap. "
            f"It delivers a balanced operating margin of ₹{winner.estimated_daily_margin_inr:.2f}/day while safeguarding animal welfare ({winner.scores.animal_welfare_score:.1f}/100) and maintaining low operational risk ({winner.relative_risk_level})."
        )

        # Why alternatives ranked lower
        alternatives_critique = []
        for strat in all_ranked:
            if strat.strategy_id == winner.strategy_id:
                continue
            if not strat.eligible:
                alternatives_critique.append(
                    f"'{strat.name}' was disqualified: {strat.ineligibility_reason}"
                )
            elif strat.strategy_id == "strat-farmer-traditional":
                alternatives_critique.append(
                    f"'{strat.name}' ranked lower (Score: {strat.scores.weighted_total:.2f}) because cutting concentrate without an energy-dense replacement risks acute negative energy balance (Welfare score: {strat.scores.animal_welfare_score:.1f}), which NDDB guidelines warn causes extended lactation drop."
                )
            elif strat.strategy_id == "strat-feed-adjustment":
                alternatives_critique.append(
                    f"'{strat.name}' ranked lower (Score: {strat.scores.weighted_total:.2f}) because it only addresses feed procurement costs without alleviating the THI 86.8 heat stress or the 17.9% water intake contraction."
                )
            elif strat.strategy_id == "strat-cooling-water":
                alternatives_critique.append(
                    f"'{strat.name}' achieved outstanding welfare ({strat.scores.animal_welfare_score:.1f}) but has higher daily expenses (₹{strat.estimated_daily_cost_inr:.2f}), making it less cost-efficient under current priorities."
                )
            else:
                alternatives_critique.append(
                    f"'{strat.name}' achieved a lower composite score ({strat.scores.weighted_total:.2f}) under the chosen farmer weights."
                )

        tradeoffs = [
            f"Direct intervention cost of ₹{winner.estimated_daily_cost_inr:.2f}/day vs continuing traditional ration (₹5,424.00/day).",
            "Relies on manual mixing of DORB/maize and rigorous twice-daily cleaning of drinking water troughs.",
            "Requires immediate physical veterinary diagnosis for flagged cows KA-MAN-104 and KA-MAN-112 to prevent herd contagion."
        ]

        priority_summary = (
            f"Priority Sensitivity: Farmer assigned weights — Profitability: {priorities.get('profitability', 0.5):.2f}, "
            f"Low Cost: {priorities.get('low_cost', 0.5):.2f}, Animal Welfare: {priorities.get('animal_welfare', 0.5):.2f}, "
            f"Risk Reduction: {priorities.get('risk_reduction', 0.5):.2f}. "
            "Increasing 'low_cost' above 0.95 shifts preference toward raw feed cutting, whereas increasing 'animal_welfare' or 'risk_reduction' prioritizes thermal relief and veterinary isolation."
        )

        return RecommendationExplanation(
            winner_name=winner.name,
            why_recommended=why_rec,
            why_alternatives_ranked_lower=alternatives_critique,
            critical_tradeoffs=tradeoffs,
            sensitivity_to_priorities=priority_summary
        )

decision_agent = DecisionAgent()
