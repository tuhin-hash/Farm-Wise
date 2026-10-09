"""Response models for FarmWise API."""
from __future__ import annotations

from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field


# --- Sub-models ---

class FarmSummary(BaseModel):
    farm_id: str
    name: str
    location: str
    owner: str
    data_mode: str
    data_disclaimer: str


class AnimalSummary(BaseModel):
    animal_id: str
    name: str
    breed: str
    age_years: int
    avg_daily_milk_litres: float
    current_daily_milk_litres: float
    health_flag: Optional[str] = None
    notes: str = ""


class ProductionRecord(BaseModel):
    date: str
    total_milk_litres: float
    avg_per_cow: float


class EnvironmentRecord(BaseModel):
    date: str
    max_temp_c: float
    min_temp_c: float
    humidity_pct: int
    thi_index: int
    heat_stress: str


class WaterRecord(BaseModel):
    date: str
    total_litres: int
    avg_per_cow_litres: float


class Alert(BaseModel):
    alert_id: str
    type: str
    severity: str
    message: str
    created_at: str


class FeedNutrition(BaseModel):
    crude_protein_pct: float
    tdn_pct: float
    crude_fibre_pct: float
    calcium_pct: float
    phosphorus_pct: float
    metabolizable_energy_mcal: float


class FeedItem(BaseModel):
    feed_id: str
    name: str
    category: str
    current_price_inr_per_kg: float
    previous_price_inr_per_kg: float
    price_change_pct: float
    availability: str
    nutrition_per_kg: FeedNutrition
    notes: str


# --- API Response Models ---

class HealthResponse(BaseModel):
    status: str = "ok"
    mode: str = "demo"  # "demo" or "llm"
    version: str = "1.0.0"
    message: str = ""


class DashboardResponse(BaseModel):
    farm: FarmSummary
    data_mode: str
    animal_count: int
    animals_needing_attention: List[AnimalSummary]
    daily_milk_litres: float
    milk_trend_pct: float
    milk_trend_description: str
    daily_feed_cost_inr: float
    estimated_daily_revenue_inr: float
    estimated_daily_margin_inr: float
    margin_assumptions: str
    production_history: List[ProductionRecord]
    environment: List[EnvironmentRecord]
    water_consumption: List[WaterRecord]
    alerts: List[Alert]


class FeedsResponse(BaseModel):
    data_disclaimer: str
    feeds: List[FeedItem]


# --- Decision Arena Models ---

class StrategyEvidence(BaseModel):
    source: str
    detail: str


class Strategy(BaseModel):
    strategy_id: str
    name: str
    description: str
    type: str  # farmer_traditional, feed_adjustment, cooling_water, hybrid
    estimated_daily_cost_inr: float
    estimated_daily_revenue_inr: Optional[float] = None
    estimated_daily_margin_inr: Optional[float] = None
    risk_level: str  # low, medium, high
    feasibility: str  # easy, moderate, difficult
    expected_impact: str
    advantages: List[str]
    drawbacks: List[str]
    evidence: List[StrategyEvidence]
    assumptions: List[str]
    missing_information: List[str]
    requires_vet_confirmation: bool = False
    requires_human_confirmation: bool = True
    within_budget: bool = True


class StrategyScore(BaseModel):
    strategy_id: str
    strategy_name: str
    raw_scores: Dict[str, float]
    weighted_scores: Dict[str, float]
    total_score: float
    rank: int
    disqualified: bool = False
    disqualification_reason: Optional[str] = None


class AgentTrace(BaseModel):
    agent_name: str
    executed: bool
    reason: str
    duration_ms: Optional[int] = None
    findings_summary: str = ""


class AnalyzeResponse(BaseModel):
    decision_id: str
    data_mode: str
    analysis_summary: str
    selected_agents: List[str]
    execution_trace: List[AgentTrace]
    evidence: Dict[str, Any]
    strategies: List[Strategy]
    scoring: List[StrategyScore]
    scoring_method: str
    recommended_strategy_id: str
    recommended_strategy_name: str
    recommendation_explanation: str
    assumptions: List[str]
    missing_data: List[str]
    safety_note: str
    data_disclaimer: str


# --- Simulator Models ---

class ScenarioResult(BaseModel):
    label: str
    feed_cost_per_cow_inr: float
    total_daily_feed_cost_inr: float
    intervention_cost_inr: float
    total_daily_cost_inr: float
    crude_protein_pct: float
    tdn_pct: float
    metabolizable_energy_mcal: float


class SimulateResponse(BaseModel):
    data_mode: str
    current_scenario: ScenarioResult
    alternative_scenario: ScenarioResult
    cost_difference_inr: float
    cost_difference_pct: float
    nutritional_tradeoffs: List[str]
    margin_current_inr: Optional[float] = None
    margin_alternative_inr: Optional[float] = None
    margin_difference_inr: Optional[float] = None
    within_budget: bool
    risk_notes: List[str]
    assumptions: List[str]
    limitations: List[str]


# --- Decision History ---

class SavedDecision(BaseModel):
    decision_id: str
    query: str
    farm_id: str
    selected_strategy_id: str
    selected_strategy_name: str
    analysis_summary: str
    farmer_notes: str
    created_at: str
    outcome: Optional[Dict[str, Any]] = None


class DecisionHistoryResponse(BaseModel):
    decisions: List[SavedDecision]
    total: int
