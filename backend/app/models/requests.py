"""Request models for FarmWise API."""
from __future__ import annotations

from typing import Optional, Dict, List
from pydantic import BaseModel, Field


class PriorityWeights(BaseModel):
    """Farmer's priority weights for decision scoring (0.0 to 1.0)."""
    profitability: float = Field(default=0.5, ge=0.0, le=1.0)
    low_cost: float = Field(default=0.5, ge=0.0, le=1.0)
    animal_welfare: float = Field(default=0.5, ge=0.0, le=1.0)
    risk_reduction: float = Field(default=0.5, ge=0.0, le=1.0)


class AnalyzeRequest(BaseModel):
    """Request body for POST /api/decision/analyze."""
    query: str = Field(..., min_length=5, max_length=2000,
                       description="Farmer's question or problem description")
    farm_id: str = Field(default="demo-farm-01")
    budget_inr: float = Field(default=5000.0, ge=0,
                              description="Daily budget available for interventions (INR)")
    farmer_strategy: Optional[str] = Field(
        default=None,
        description="The farmer's own proposed approach (included as a candidate strategy)")
    priorities: PriorityWeights = Field(default_factory=PriorityWeights)


class SimulateRequest(BaseModel):
    """Request body for POST /api/decision/simulate."""
    farm_id: str = Field(default="demo-farm-01")
    feed_a_id: str = Field(..., description="Current feed ingredient ID")
    feed_b_id: str = Field(..., description="Alternative feed ingredient ID")
    substitution_pct: float = Field(default=50.0, ge=0, le=100,
                                    description="Percentage of feed_a to replace with feed_b")
    num_animals: int = Field(default=24, ge=1, le=1000)
    feed_quantity_kg_per_cow: float = Field(default=6.0, ge=0.1, le=50)
    milk_price_inr_per_litre: float = Field(default=35.0, ge=1)
    intervention_cost_inr_per_day: float = Field(default=0.0, ge=0,
                                                  description="Additional daily cost (cooling, veterinary, etc.)")
    budget_inr: float = Field(default=5000.0, ge=0)
    priorities: PriorityWeights = Field(default_factory=PriorityWeights)


class SaveDecisionRequest(BaseModel):
    """Request body for POST /api/decisions — save a completed decision."""
    decision_id: str
    query: str
    farm_id: str = "demo-farm-01"
    selected_strategy_id: str
    selected_strategy_name: str
    analysis_summary: str = ""
    full_response: Optional[Dict] = None
    farmer_notes: str = ""


class RecordOutcomeRequest(BaseModel):
    """Request body for POST /api/decisions/{decision_id}/outcome."""
    actual_result: str = Field(..., min_length=5,
                               description="Farmer's description of what actually happened")
    milk_change_litres: Optional[float] = None
    cost_change_inr: Optional[float] = None
    satisfaction: Optional[int] = Field(default=None, ge=1, le=5,
                                        description="1-5 satisfaction rating")
    notes: str = ""
