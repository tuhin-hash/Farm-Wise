"""API Route Definitions for FarmWise."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.models.requests import (
    AnalyzeRequest, SimulateRequest, SaveDecisionRequest, RecordOutcomeRequest
)
from app.models.responses import (
    HealthResponse, DashboardResponse, FeedsResponse,
    AnalyzeResponse, SimulateResponse, DecisionHistoryResponse, SavedDecision,
    FarmSummary, AnimalSummary, ProductionRecord, EnvironmentRecord, WaterRecord, Alert
)
from app.services.data_service import (
    get_farm_data, get_feeds_data, get_animals, get_animals_with_flags,
    get_production_history, get_production_trend, get_environment,
    get_water_consumption, get_alerts, calculate_daily_feed_cost
)
from app.services.llm_service import get_mode
from app.services.decision_service import (
    analyze_query, simulate_scenario, save_decision, record_outcome, list_decisions
)
from app.tools.calculators import calculate_daily_revenue, calculate_margin

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse, tags=["System"])
def get_health() -> HealthResponse:
    """Return service health status and LLM mode (live LLM or demo fallback)."""
    mode = get_mode()
    msg = "FarmWise backend running in live LLM mode." if mode == "llm" else "FarmWise backend running in deterministic demo mode (no LLM key required)."
    return HealthResponse(
        status="ok",
        mode=mode,
        version="1.0.0",
        message=msg,
    )


@router.get("/dashboard", response_model=DashboardResponse, tags=["Dashboard"])
def get_dashboard(farm_id: str = "demo-farm-01") -> DashboardResponse:
    """Return dairy farm metrics, recent trends, environmental condition, and active alerts."""
    farm_raw = get_farm_data(farm_id)
    farm_info = farm_raw["farm"]
    animals = get_animals(farm_id)
    flagged = get_animals_with_flags(farm_id)
    production = get_production_history(farm_id)
    prod_trend = get_production_trend(farm_id)
    env = get_environment(farm_id)
    water = get_water_consumption(farm_id)
    alerts_raw = get_alerts(farm_id)
    feed_cost_data = calculate_daily_feed_cost(farm_id)
    
    current_milk = production[-1]["total_milk_litres"] if production else 408.0
    milk_price = 35.0  # INR per litre
    revenue = calculate_daily_revenue(current_milk, milk_price)
    margin_data = calculate_margin(revenue, feed_cost_data["total_inr"])
    
    attention_animals = [
        AnimalSummary(
            animal_id=a["animal_id"],
            name=a["name"],
            breed=a["breed"],
            age_years=a["age_years"],
            avg_daily_milk_litres=a["avg_daily_milk_litres"],
            current_daily_milk_litres=a["current_daily_milk_litres"],
            health_flag=a.get("health_flag"),
            notes=a.get("notes", ""),
        )
        for a in flagged
    ]
    
    return DashboardResponse(
        farm=FarmSummary(
            farm_id=farm_info["farm_id"],
            name=farm_info["name"],
            location=farm_info["location"],
            owner=farm_info["owner"],
            data_mode=farm_info["data_mode"],
            data_disclaimer=farm_info["data_disclaimer"],
        ),
        data_mode="synthetic_demo",
        animal_count=len(animals),
        animals_needing_attention=attention_animals,
        daily_milk_litres=current_milk,
        milk_trend_pct=prod_trend["trend_pct"],
        milk_trend_description=prod_trend["description"],
        daily_feed_cost_inr=feed_cost_data["total_inr"],
        estimated_daily_revenue_inr=revenue,
        estimated_daily_margin_inr=margin_data["margin_inr"],
        margin_assumptions=f"Assumes ₹{milk_price}/L milk sale price and current feed ration pricing.",
        production_history=[ProductionRecord(**p) for p in production],
        environment=[EnvironmentRecord(**e) for e in env],
        water_consumption=[WaterRecord(**w) for w in water],
        alerts=[Alert(**a) for a in alerts_raw],
    )


@router.get("/feeds", response_model=FeedsResponse, tags=["Feeds"])
def get_feeds() -> FeedsResponse:
    """Return available feed alternatives, prices, nutritional composition, and provenance."""
    feeds_raw = get_feeds_data()
    return FeedsResponse(
        data_disclaimer=feeds_raw.get("data_disclaimer", ""),
        feeds=feeds_raw.get("feeds", []),
    )


@router.post("/decision/analyze", response_model=AnalyzeResponse, tags=["Decision Arena"])
def analyze_farm_query(request: AnalyzeRequest) -> AnalyzeResponse:
    """Run the multi-agent decision arena to analyze query, evaluate 4+ candidate strategies, and rank options."""
    try:
        return analyze_query(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")


@router.post("/decision/simulate", response_model=SimulateResponse, tags=["Simulator"])
def simulate_feed_scenario(request: SimulateRequest) -> SimulateResponse:
    """Run deterministic what-if scenario calculator for feed substitution and cost/margin projection."""
    try:
        return simulate_scenario(request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@router.get("/decisions", response_model=DecisionHistoryResponse, tags=["Decision History"])
def get_decisions(farm_id: Optional[str] = Query(default=None)) -> DecisionHistoryResponse:
    """Retrieve saved decision history."""
    try:
        return list_decisions(farm_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database fetch error: {str(e)}")


@router.post("/decisions", response_model=SavedDecision, tags=["Decision History"])
def create_decision(request: SaveDecisionRequest) -> SavedDecision:
    """Save a chosen decision and farmer strategy selection."""
    try:
        return save_decision(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving decision: {str(e)}")


@router.post("/decisions/{decision_id}/outcome", tags=["Decision History"])
def add_decision_outcome(decision_id: str, request: RecordOutcomeRequest):
    """Record farmer observed outcome for a past decision."""
    try:
        return record_outcome(decision_id, request)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording outcome: {str(e)}")
