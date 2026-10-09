from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.tools.scoring import StrategyEvaluation, ScoringBreakdown

class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    app_name: str
    app_version: str
    data_mode: str = Field(..., json_schema_extra={"example": "synthetic_demo"})
    llm_enabled: bool
    llm_provider: str
    llm_model: str
    timestamp: str

class BreedBreakdown(BaseModel):
    HF_Cross: int
    Jersey_Cross: int
    Gir_Indigenous: int

class DailyProductionSummary(BaseModel):
    current_litres: float
    baseline_litres: float
    trend_percentage: float
    current_daily_revenue_inr: float
    baseline_daily_revenue_inr: float

class WaterConsumptionSummary(BaseModel):
    current_litres_per_cow: float
    baseline_litres_per_cow: float
    trend_percentage: float
    alert_level: str
    observation: str

class RationItemResponse(BaseModel):
    feed_id: str
    feed_name: str
    quantity_kg_per_cow: float
    unit_price_inr_per_kg: float
    daily_cost_herd_inr: float
    price_change_note: Optional[str] = None

class FeedRationSummary(BaseModel):
    ration_name: str
    total_daily_feed_cost_inr: float
    cost_per_cow_per_day_inr: float
    estimated_daily_margin_inr: float
    margin_assumptions: str
    items: List[RationItemResponse]

class EnvironmentalConditions(BaseModel):
    ambient_temperature_celsius: float
    relative_humidity_percentage: float
    thi_index: float
    heat_stress_category: str
    shed_ventilation_type: str
    recorded_at: str
    interpretation: str

class AlertItem(BaseModel):
    id: str
    severity: str
    category: str
    message: str

class AttentionAnimal(BaseModel):
    animal_tag: str
    breed: str
    days_in_milk: int
    rectal_temperature_celsius: float
    respiration_rate_bpm: int
    appetite_observation: str
    suspected_issue: str
    action_required: str
    veterinary_escalation: bool

class ProductionHistoryPoint(BaseModel):
    day: int
    date: str
    milk_litres: float
    avg_temp_c: float
    water_litres_per_cow: float

class DashboardResponse(BaseModel):
    farm_id: str
    farm_name: str
    location: str
    data_mode: str
    provenance_note: str
    animal_count: int
    breeds: Dict[str, int]
    milk_sale_price_inr_per_litre: float
    daily_production: DailyProductionSummary
    water_consumption: WaterConsumptionSummary
    current_feed_ration: FeedRationSummary
    environmental_conditions: EnvironmentalConditions
    active_alerts: List[AlertItem]
    animals_requiring_attention: List[AttentionAnimal]
    production_history_14d: List[ProductionHistoryPoint]

class FeedItem(BaseModel):
    feed_id: str
    name: str
    category: str
    unit_price_inr_per_kg: float
    baseline_price_inr_per_kg: Optional[float] = None
    dry_matter_pct: float
    crude_protein_pct: float
    energy_tdn_pct: float
    energy_me_mj_per_kg: Optional[float] = None
    calcium_pct: Optional[float] = None
    phosphorus_pct: Optional[float] = None
    availability: str
    provenance: str
    notes: Optional[str] = None

class FeedsResponse(BaseModel):
    total_feeds: int
    data_mode: str
    feeds: List[FeedItem]

class ExecutionTraceStep(BaseModel):
    agent: str
    status: str
    summary: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None

class RecommendationExplanation(BaseModel):
    winner_name: str
    why_recommended: str
    why_alternatives_ranked_lower: List[str]
    critical_tradeoffs: List[str]
    sensitivity_to_priorities: str

class AnalyzeDecisionResponse(BaseModel):
    decision_id: str
    farm_id: str
    data_mode: str
    query: str
    analysis_summary: str
    selected_agents: List[str]
    execution_trace: List[ExecutionTraceStep]
    evidence: Dict[str, Any]
    candidate_strategies: List[StrategyEvaluation]
    recommended_strategy_id: str
    explanation: RecommendationExplanation
    assumptions: List[str]
    missing_data: List[str]
    safety_notes: List[str]
    created_at: str

class SimulateResponse(BaseModel):
    feed_a: Dict[str, Any]
    feed_b: Dict[str, Any]
    substitution_percentage: float
    animal_count: int
    current_scenario: Dict[str, Any]
    alternative_scenario: Dict[str, Any]
    cost_difference_daily_inr: float
    margin_difference_daily_inr: float
    nutritional_tradeoffs: Dict[str, Any]
    risk_notes: List[str]
    assumptions_and_limitations: List[str]
    eligible_under_budget: bool
    budget_inr: float
    data_mode: str

class DecisionHistoryItem(BaseModel):
    decision_id: str
    farm_id: str
    created_at: str
    query: str
    farmer_strategy: Optional[str] = None
    budget_inr: Optional[float] = None
    recommended_strategy_id: Optional[str] = None
    selected_by_farmer_strategy_id: Optional[str] = None
    farmer_notes: Optional[str] = None
    status: str
    candidate_strategies: Optional[List[Dict[str, Any]]] = None
    outcomes: Optional[List[Dict[str, Any]]] = None

class DecisionHistoryResponse(BaseModel):
    total_decisions: int
    decisions: List[DecisionHistoryItem]

class RecordOutcomeResponse(BaseModel):
    decision_id: str
    recorded_at: str
    message: str
    outcome_id: int
