"""State definition for FarmWise multi-agent workflow."""
from __future__ import annotations

from typing import Dict, Any, List, Optional
from typing_extensions import TypedDict


class FarmWiseState(TypedDict, total=False):
    """Shared state passed between agents in the LangGraph workflow."""
    decision_id: str
    query: str
    farm_id: str
    budget_inr: float
    farmer_strategy: Optional[str]
    priorities: Dict[str, float]
    
    # Orchestrator outputs
    intents: List[str]
    required_agents: List[str]
    orchestrator_summary: str
    
    # Execution tracking
    execution_trace: List[Dict[str, Any]]
    agent_results: Dict[str, Any]
    
    # Decision Arena outputs
    strategies: List[Dict[str, Any]]
    scoring: List[Dict[str, Any]]
    recommended_strategy_id: str
    recommended_strategy_name: str
    recommendation_explanation: str
    
    # Metadata and guards
    assumptions: List[str]
    missing_data: List[str]
    safety_note: str
    data_mode: str
    error: Optional[str]
