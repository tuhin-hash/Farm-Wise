from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AnalyzeDecisionRequest(BaseModel):
    query: str = Field(..., description="Farmer's natural language question or problem description", min_length=3)
    farm_id: str = Field(default="demo-farm-01", description="Farm identifier")
    budget_inr: float = Field(default=5000.0, description="Available daily operating budget in INR", ge=0.0)
    farmer_strategy: Optional[str] = Field(
        default="Reduce concentrate feed and increase green fodder",
        description="Farmer's traditional or proposed heuristic action"
    )
    priorities: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {
            "profitability": 0.7,
            "low_cost": 0.8,
            "animal_welfare": 1.0,
            "risk_reduction": 0.9,
            "operational_feasibility": 0.6
        },
        description="Farmer priority weights (typically 0.0 to 1.0)"
    )

class SimulateRequest(BaseModel):
    feed_a_id: str = Field(default="feed-conc-01", description="Baseline feed being replaced/reduced")
    feed_b_id: str = Field(default="feed-dorb-01", description="Alternative substitute feed ingredient")
    substitution_percentage: float = Field(default=25.0, description="Percentage of Feed A replaced by Feed B (0-100)", ge=0.0, le=100.0)
    animal_count: int = Field(default=24, description="Number of lactating animals", ge=1)
    milk_sale_price_inr: float = Field(default=38.0, description="Sale price per litre of milk in INR", ge=0.0)
    daily_milk_production_litres: Optional[float] = Field(default=410.0, description="Expected or current daily herd milk yield in litres", ge=0.0)
    intervention_cost_inr: float = Field(default=0.0, description="Additional daily cost of interventions (e.g. cooling, misting) in INR", ge=0.0)
    budget_inr: float = Field(default=5000.0, description="Farmer daily budget cap in INR", ge=0.0)
    priorities: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {
            "profitability": 0.8,
            "low_cost": 0.8,
            "animal_welfare": 0.8,
            "risk_reduction": 0.8
        }
    )
    current_feed_prices: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional overrides for feed prices per kg in INR"
    )

class SaveDecisionRequest(BaseModel):
    decision_id: str = Field(..., description="ID of the analyzed decision")
    farm_id: str = Field(default="demo-farm-01", description="Farm identifier")
    selected_strategy_id: str = Field(..., description="Strategy ID selected by the farmer to execute")
    farmer_notes: Optional[str] = Field(default=None, description="Optional notes or implementation plan by the farmer")

class RecordOutcomeRequest(BaseModel):
    action_taken: str = Field(..., description="Description of the action actually carried out by the farmer")
    actual_cost_inr: Optional[float] = Field(default=None, description="Actual recorded expenditure in INR")
    observed_milk_change_litres: Optional[float] = Field(default=None, description="Observed change in herd milk yield (positive or negative litres)")
    farmer_notes: Optional[str] = Field(default=None, description="Observations, cow reactions, or challenges encountered")
    outcome_rating: Optional[int] = Field(default=None, ge=1, le=5, description="Farmer satisfaction rating (1 to 5)")
