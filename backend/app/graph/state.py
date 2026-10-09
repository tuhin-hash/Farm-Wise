from typing import Dict, Any, List, Optional, TypedDict
from app.models.responses import StrategyEvaluation, RecommendationExplanation

class FarmWiseGraphState(TypedDict, total=False):
    # Inputs
    query: str
    farm_id: str
    budget_inr: float
    farmer_strategy: str
    priorities: Dict[str, float]

    # Orchestrator plan
    intent: str
    intent_summary: str
    selected_agents: List[str]
    task_plan: List[Dict[str, Any]]
    routing_reason: str

    # Execution Trace
    execution_trace: List[Dict[str, Any]]

    # Agent outputs & evidences
    farm_data_evidence: Dict[str, Any]
    risk_environment_evidence: Dict[str, Any]
    nutrition_evidence: Dict[str, Any]
    finance_evidence: Dict[str, Any]

    # Decision Arena results
    candidate_strategies: List[Dict[str, Any]]
    ranked_strategies: List[StrategyEvaluation]
    recommended_strategy_id: str
    explanation: Dict[str, Any]

    # Metadata & Safeguards
    assumptions: List[str]
    missing_data: List[str]
    safety_notes: List[str]
    data_mode: str
