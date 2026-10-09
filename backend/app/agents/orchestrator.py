"""Orchestrator Agent — understands the farmer's query, identifies intent,
determines which agents should execute, and produces a structured task plan.

Routes tasks conditionally: a feed-price query doesn't need health analysis;
a production-decline query may need farm data + nutrition + environment + finance.
"""
from __future__ import annotations

import time
from typing import Dict, Any, List, Set

from app.services.llm_service import llm_interpret, get_mode


# Intent categories and their required agents
INTENT_AGENT_MAP: Dict[str, List[str]] = {
    "production_decline": ["farm_data", "nutrition", "risk_environment", "finance", "decision"],
    "feed_cost":          ["farm_data", "nutrition", "finance", "decision"],
    "feed_change":        ["nutrition", "finance", "decision"],
    "heat_stress":        ["farm_data", "risk_environment", "finance", "decision"],
    "animal_health":      ["farm_data", "risk_environment", "decision"],
    "water_issue":        ["farm_data", "risk_environment", "decision"],
    "general_advice":     ["farm_data", "nutrition", "risk_environment", "finance", "decision"],
    "financial":          ["farm_data", "finance", "decision"],
}

# Keywords for rule-based intent detection (fallback when no LLM)
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "production_decline": ["production", "decline", "drop", "yield", "less milk", "lower milk", "decreased"],
    "feed_cost":          ["feed price", "feed cost", "expensive", "price rise", "price increase", "costly"],
    "feed_change":        ["feed change", "switch feed", "alternative feed", "substitute", "replace feed"],
    "heat_stress":        ["heat", "temperature", "hot", "summer", "cooling", "thi"],
    "animal_health":      ["sick", "health", "disease", "lameness", "appetite", "veterinary", "vet"],
    "water_issue":        ["water", "drinking", "thirst", "dehydration"],
    "financial":          ["profit", "margin", "revenue", "budget", "roi", "cost analysis"],
}


def run(query: str, farm_id: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Analyze the query, detect intent, and plan agent execution.

    Returns a task plan specifying which agents to invoke and why.
    """
    start = time.time()

    # Detect intent
    intents = _detect_intents(query)

    # Determine required agents (union of all detected intents)
    required_agents: Set[str] = set()
    for intent in intents:
        agents = INTENT_AGENT_MAP.get(intent, INTENT_AGENT_MAP["general_advice"])
        required_agents.update(agents)

    # Decision agent is always included
    required_agents.add("decision")

    # Build execution plan with reasons
    plan = []
    all_possible = ["farm_data", "nutrition", "risk_environment", "finance", "decision"]
    for agent_name in all_possible:
        if agent_name in required_agents:
            plan.append({
                "agent": agent_name,
                "execute": True,
                "reason": _agent_reason(agent_name, intents),
            })
        else:
            plan.append({
                "agent": agent_name,
                "execute": False,
                "reason": f"Not required for detected intent(s): {', '.join(intents)}",
            })

    duration_ms = int((time.time() - start) * 1000)

    return {
        "agent": "orchestrator",
        "executed": True,
        "duration_ms": duration_ms,
        "findings": {
            "query": query,
            "detected_intents": intents,
            "required_agents": sorted(required_agents),
            "execution_plan": plan,
            "mode": get_mode(),
        },
        "summary": (
            f"Detected intent(s): {', '.join(intents)}. "
            f"Routing to {len(required_agents)} agent(s): {', '.join(sorted(required_agents))}."
        ),
    }


def _detect_intents(query: str) -> List[str]:
    """Detect query intents using keyword matching (with optional LLM enhancement)."""
    query_lower = query.lower()
    detected = []

    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in query_lower for kw in keywords):
            detected.append(intent)

    # If nothing detected, try LLM if available
    if not detected:
        llm_result = llm_interpret(
            f"Classify this farmer's query into one or more categories: "
            f"{', '.join(INTENT_KEYWORDS.keys())}. "
            f"Query: '{query}'. Return only the category names separated by commas.",
            fallback="",
        )
        if llm_result:
            for intent in INTENT_KEYWORDS:
                if intent in llm_result.lower():
                    detected.append(intent)

    # Default to general advice if still nothing
    if not detected:
        detected = ["general_advice"]

    return detected


def _agent_reason(agent_name: str, intents: List[str]) -> str:
    """Explain why an agent is being invoked."""
    reasons = {
        "farm_data": "Retrieve farm records, production trends, and animal data",
        "nutrition": "Analyze feed alternatives and nutritional trade-offs",
        "risk_environment": "Assess environmental risks and health indicators",
        "finance": "Calculate costs, revenue, margins, and budget feasibility",
        "decision": "Compare strategies and produce a ranked recommendation",
    }
    return reasons.get(agent_name, "Required for analysis")
