"""Orchestrator Agent for FarmWise.
Parses farmer query intent, produces structured task plan, and routes agents conditionally.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone

class OrchestratorAgent:
    @staticmethod
    def plan_and_route(query: str, farmer_strategy: str = "") -> Dict[str, Any]:
        """Analyzes query keywords, intent, and context to select relevant agents.
        Ensures conditional execution:
          - A pure feed-price query does not invoke livestock health analysis.
          - A production-decline or heat query invokes farm data, risk & environment, nutrition, finance, and decision.
        """
        q_lower = query.lower()
        strat_lower = (farmer_strategy or "").lower()
        combined = f"{q_lower} {strat_lower}"

        # Intent detection
        is_feed_price_only = any(term in combined for term in ["feed price", "grain cost", "concentrate cost", "feed rate", "cheaper feed"]) and not any(term in combined for term in ["drop", "decline", "sick", "fever", "heat", "hot", "water", "milk down", "production fell", "dying"])
        is_health_risk_dominant = any(term in combined for term in ["sick", "fever", "mastitis", "temp", "infection", "lethargic", "not eating", "refusal", "breath", "panting"])
        is_heat_or_environment = any(term in combined for term in ["heat", "hot", "summer", "weather", "temperature", "fan", "water intake", "thi"])
        is_production_drop = any(term in combined for term in ["drop", "decline", "fall", "decreased", "milk down", "lower yield", "less milk", "production"])

        # Agent selection logic
        selected_agents = ["orchestrator"]

        if is_feed_price_only:
            # Conditional routing: only nutrition, finance, and decision
            selected_agents.extend(["nutrition", "finance", "decision"])
            intent_summary = "Feed price optimization and substitute analysis."
            task_plan = [
                {"step": 1, "agent": "nutrition", "action": "Analyze feed prices, CP, TDN energy, and replacement candidates."},
                {"step": 2, "agent": "finance", "action": "Calculate deterministic feed costs and ration budget comparisons."},
                {"step": 3, "agent": "decision", "action": "Rank feed strategies according to farmer cost and welfare priorities."}
            ]
        else:
            # Comprehensive multi-agent investigation: farm data, risk & environment, nutrition, finance, decision
            selected_agents.extend(["farm_data", "risk_environment", "nutrition", "finance", "decision"])
            intent_summary = "Multi-factor production decline investigation (heat stress, water reduction, feed inflation)."
            task_plan = [
                {"step": 1, "agent": "farm_data", "action": "Retrieve 14-day production records, water trends, and inspect flagged cows."},
                {"step": 2, "agent": "risk_environment", "action": "Calculate THI, evaluate heat stress and water intake anomaly, flag vet concerns."},
                {"step": 3, "agent": "nutrition", "action": "Evaluate current 20% CP ration against heat-stress metabolic demands and feed inflation."},
                {"step": 4, "agent": "finance", "action": "Model 4 deterministic scenarios: Farmer's cut, Feed substitution, Cooling/water, and Hybrid."},
                {"step": 5, "agent": "decision", "action": "Score candidate strategies against priorities, enforce budget constraints, and rank winner."}
            ]

        return {
            "intent": "FEED_OPTIMIZATION" if is_feed_price_only else "PRODUCTION_DECLINE_AND_STRESS",
            "intent_summary": intent_summary,
            "selected_agents": selected_agents,
            "task_plan": task_plan,
            "routing_reason": (
                "Feed-focused routing selected to minimize extraneous health processing."
                if is_feed_price_only
                else "Holistic production drop routing activated: requires herd data, environmental THI risk, nutrition review, and deterministic financial modeling."
            ),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

orchestrator_agent = OrchestratorAgent()
