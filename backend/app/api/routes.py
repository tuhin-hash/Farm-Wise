import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path, Body, File, UploadFile, Form

from app.config import settings
from app.services.data_service import data_service
from app.services.llm_service import llm_service
from app.services.decision_service import decision_service
from app.services.voice_service import voice_service
from app.services.sms_service import sms_service
from app.graph.workflow import execute_agent_workflow
from app.tools.calculators import (
    calculate_feed_blend,
    calculate_herd_feed_cost,
    calculate_milk_revenue,
    calculate_daily_margin
)
from app.tools.feed_comparison import analyze_nutritional_tradeoffs
from app.models.requests import (
    AnalyzeDecisionRequest,
    SimulateRequest,
    SaveDecisionRequest,
    RecordOutcomeRequest
)
from app.models.responses import (
    HealthResponse,
    DashboardResponse,
    FeedsResponse,
    FeedItem,
    AnalyzeDecisionResponse,
    SimulateResponse,
    DecisionHistoryResponse,
    DecisionHistoryItem,
    RecordOutcomeResponse
)

from app.services.veterinary_service import evaluate_animal_vitals, assess_all_attention_animals, MERCK_VITAL_RANGES

router = APIRouter(prefix="/api")

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint indicating service state and LLM operating mode."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        data_mode=settings.DATA_MODE,
        llm_enabled=llm_service.is_configured,
        llm_provider="Groq (or Groq-compatible provider)" if llm_service.is_configured else "Deterministic Rule-Based / Demo Mode (No API key required)",
        llm_model=settings.GROQ_MODEL if llm_service.is_configured else "rule-based-engine",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(farm_id: str = "demo-farm-01"):
    """Returns current farm overview, production trends, active alerts, and flagged cows."""
    farm = data_service.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")

    prod_hist = data_service.get_production_history(farm_id, days=14)
    env_thi = farm.get("environmental_conditions", {}).get("thi_index", 86.8)

    # Enrich attention animals with Merck-grounded veterinary clinical assessments
    enriched_animals = []
    for anim in farm.get("animals_requiring_attention", []):
        anim_dict = dict(anim)
        assessment = evaluate_animal_vitals(anim_dict, environmental_thi=env_thi)
        anim_dict["veterinary_assessment"] = assessment.model_dump()
        enriched_animals.append(anim_dict)

    return DashboardResponse(
        farm_id=farm["farm_id"],
        farm_name=farm["farm_name"],
        location=farm["location"],
        data_mode=farm.get("data_mode", settings.DATA_MODE),
        provenance_note=farm.get("provenance_note", "Synthetic benchmark dairy farm"),
        animal_count=farm["animal_count"],
        breeds=farm["breeds"],
        milk_sale_price_inr_per_litre=farm["milk_sale_price_inr_per_litre"],
        daily_production=farm["daily_production"],
        water_consumption=farm["water_consumption"],
        current_feed_ration=farm["current_feed_ration"],
        environmental_conditions=farm["environmental_conditions"],
        active_alerts=farm["active_alerts"],
        animals_requiring_attention=enriched_animals,
        production_history_14d=farm.get("production_history_14d", prod_hist)
    )

@router.get("/veterinary/assessments")
def get_veterinary_assessments(farm_id: str = "demo-farm-01"):
    """Returns clinical veterinary assessments grounded in Merck Veterinary Manual reference standards."""
    farm = data_service.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")
    thi = farm.get("environmental_conditions", {}).get("thi_index", 86.8)
    assessments = assess_all_attention_animals(farm.get("animals_requiring_attention", []), thi=thi)
    return {
        "reference_standard": "Merck Veterinary Manual (Adult Bovine Vital Signs Standards)",
        "resting_vital_ranges": MERCK_VITAL_RANGES,
        "total_assessed": len(assessments),
        "assessments": [a.model_dump() for a in assessments]
    }

@router.get("/veterinary/assessment/{animal_tag}")
def get_animal_veterinary_assessment(animal_tag: str, farm_id: str = "demo-farm-01"):
    """Returns clinical veterinary assessment and 'Why Vet Recommended' breakdown for a specific animal."""
    farm = data_service.get_farm(farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm '{farm_id}' not found.")
    thi = farm.get("environmental_conditions", {}).get("thi_index", 86.8)
    for anim in farm.get("animals_requiring_attention", []):
        if anim.get("animal_tag", "").upper() == animal_tag.upper():
            return evaluate_animal_vitals(anim, environmental_thi=thi).model_dump()
    raise HTTPException(status_code=404, detail=f"Animal '{animal_tag}' not found in attention list.")

@router.get("/feeds", response_model=FeedsResponse)
def get_feeds():
    """Returns the catalog of available feeds, nutritional parameters, and data provenance."""
    feeds = data_service.get_feeds()
    return FeedsResponse(
        total_feeds=len(feeds),
        data_mode=settings.DATA_MODE,
        feeds=[FeedItem(**f) for f in feeds]
    )

@router.post("/decision/analyze", response_model=AnalyzeDecisionResponse)
async def analyze_decision(payload: AnalyzeDecisionRequest):
    """Triggers the full multi-agent decision engine via LangGraph.
    Routes conditionally, evaluates candidate strategies in the Decision Arena,
    and returns a ranked strategy with explanations.
    """
    decision_id = f"dec-{uuid.uuid4().hex[:8]}"

    # Execute LangGraph workflow
    graph_state = await execute_agent_workflow(
        query=payload.query,
        farm_id=payload.farm_id,
        budget_inr=payload.budget_inr,
        farmer_strategy=payload.farmer_strategy or "",
        priorities=payload.priorities or {}
    )

    ranked_strategies = graph_state.get("ranked_strategies", [])
    recommended_id = graph_state.get("recommended_strategy_id", "")
    explanation = graph_state.get("explanation", {})

    evidence = {
        "farm_data": graph_state.get("farm_data_evidence"),
        "risk_environment": graph_state.get("risk_environment_evidence"),
        "nutrition": graph_state.get("nutrition_evidence"),
        "finance": graph_state.get("finance_evidence")
    }

    # Filter out empty evidence if agents were skipped
    evidence = {k: v for k, v in evidence.items() if v is not None}

    response_data = {
        "decision_id": decision_id,
        "farm_id": payload.farm_id,
        "data_mode": settings.DATA_MODE,
        "query": payload.query,
        "farmer_strategy": payload.farmer_strategy,
        "budget_inr": payload.budget_inr,
        "priorities": payload.priorities,
        "analysis_summary": graph_state.get("intent_summary", "Multi-factor farm decision analysis completed."),
        "selected_agents": graph_state.get("selected_agents", []),
        "execution_trace": graph_state.get("execution_trace", []),
        "evidence": evidence,
        "candidate_strategies": ranked_strategies,
        "recommended_strategy_id": recommended_id,
        "explanation": explanation,
        "assumptions": graph_state.get("assumptions", []),
        "missing_data": graph_state.get("missing_data", []),
        "safety_notes": graph_state.get("safety_notes", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Persist decision to SQLite history
    decision_service.save_decision_record(response_data)

    return AnalyzeDecisionResponse(**response_data)

@router.post("/decision/simulate", response_model=SimulateResponse)
def simulate_scenario(payload: SimulateRequest):
    """What-If simulator supporting custom feed substitution percentages,
    animal counts, feed prices, milk prices, intervention costs, and budget constraints.
    """
    feed_a = data_service.get_feed_by_id(payload.feed_a_id)
    feed_b = data_service.get_feed_by_id(payload.feed_b_id)

    if not feed_a:
        raise HTTPException(status_code=400, detail=f"Baseline feed '{payload.feed_a_id}' not found.")
    if not feed_b:
        raise HTTPException(status_code=400, detail=f"Alternative feed '{payload.feed_b_id}' not found.")

    # Override prices if supplied
    if payload.current_feed_prices:
        if payload.feed_a_id in payload.current_feed_prices:
            feed_a["unit_price_inr_per_kg"] = float(payload.current_feed_prices[payload.feed_a_id])
        if payload.feed_b_id in payload.current_feed_prices:
            feed_b["unit_price_inr_per_kg"] = float(payload.current_feed_prices[payload.feed_b_id])

    # Calculate blend composition
    blend = calculate_feed_blend(feed_a, feed_b, payload.substitution_percentage)

    # Standard dairy baseline daily ration assumptions: 4.5kg concentrate, 18kg green fodder @ ₹2.5, 5kg dry @ ₹4.5, 0.15kg mineral @ ₹65
    conc_qty_per_cow = 4.5
    price_a = float(feed_a["unit_price_inr_per_kg"])
    price_blended = blend.blended_unit_price_inr_per_kg

    # Current scenario daily costs
    current_conc_cost_cow = conc_qty_per_cow * price_a
    current_other_feed_cow = (18.0 * 2.5) + (5.0 * 4.5) + (0.15 * 65.0)  # ₹77.25
    current_total_feed_cow = current_conc_cost_cow + current_other_feed_cow
    current_herd_feed_cost = round(current_total_feed_cow * payload.animal_count, 2)
    current_milk = float(payload.daily_milk_production_litres or 410.0)
    current_rev = calculate_milk_revenue(current_milk, payload.milk_sale_price_inr)
    current_margin = calculate_daily_margin(current_rev, current_herd_feed_cost)

    # Alternative scenario daily costs
    alt_conc_cost_cow = conc_qty_per_cow * price_blended
    alt_total_feed_cow = alt_conc_cost_cow + current_other_feed_cow
    alt_herd_feed_cost = round(alt_total_feed_cow * payload.animal_count, 2)
    alt_total_cost = round(alt_herd_feed_cost + payload.intervention_cost_inr, 2)

    # Modeled milk impact assumption: If protein/energy delta is negative, small yield decline may occur; if cooling intervention added, recovery occurs
    expected_milk_delta = 0.0
    if payload.intervention_cost_inr > 100.0:
        expected_milk_delta += 15.0  # Cooling recovery
    if blend.crude_protein_delta_pct < -3.0:
        expected_milk_delta -= 10.0  # Protein deficit drop

    alt_milk = max(200.0, current_milk + expected_milk_delta)
    alt_rev = calculate_milk_revenue(alt_milk, payload.milk_sale_price_inr)
    alt_margin = calculate_daily_margin(alt_rev, alt_herd_feed_cost, payload.intervention_cost_inr)

    cost_diff = round(alt_total_cost - current_herd_feed_cost, 2)
    margin_diff = round(alt_margin - current_margin, 2)

    tradeoffs = analyze_nutritional_tradeoffs(feed_a, feed_b)

    risk_notes = []
    if payload.substitution_percentage > 40.0:
        risk_notes.append(f"High substitution ({payload.substitution_percentage}%): Excessive replacement may cause sudden palatability rejection or rumen dysbiosis.")
    if blend.crude_protein_delta_pct < -2.0:
        risk_notes.append(f"Protein reduction (-{abs(blend.crude_protein_delta_pct):.1f}%): Monitor milk urea nitrogen (MUN) and milk protein percentage.")
    if alt_total_cost > payload.budget_inr:
        risk_notes.append(f"Budget Exceeded: Alternative expenditure of ₹{alt_total_cost:.2f} exceeds budget of ₹{payload.budget_inr:.2f}.")

    assumptions = [
        f"Lactating herd size: {payload.animal_count} cows.",
        f"Base milk sale price: ₹{payload.milk_sale_price_inr:.2f}/litre.",
        f"Blended concentrate allowance: {conc_qty_per_cow} kg/cow/day.",
        "Fixed roughage base: 18kg green fodder (₹2.5/kg) and 5kg dry fodder (₹4.5/kg) per cow.",
        "Biological milk volume response is a modeled scenario assumption, not a guaranteed empirical result."
    ]

    eligible = alt_total_cost <= payload.budget_inr

    return SimulateResponse(
        feed_a=feed_a,
        feed_b=feed_b,
        substitution_percentage=payload.substitution_percentage,
        animal_count=payload.animal_count,
        current_scenario={
            "feed_cost_inr": current_herd_feed_cost,
            "intervention_cost_inr": 0.0,
            "total_cost_inr": current_herd_feed_cost,
            "daily_milk_litres": current_milk,
            "daily_revenue_inr": current_rev,
            "daily_margin_inr": current_margin,
            "concentrate_unit_price_inr_per_kg": price_a
        },
        alternative_scenario={
            "feed_cost_inr": alt_herd_feed_cost,
            "intervention_cost_inr": payload.intervention_cost_inr,
            "total_cost_inr": alt_total_cost,
            "daily_milk_litres": alt_milk,
            "daily_revenue_inr": alt_rev,
            "daily_margin_inr": alt_margin,
            "blended_concentrate_price_inr_per_kg": price_blended,
            "blended_crude_protein_pct": blend.blended_crude_protein_pct,
            "blended_energy_tdn_pct": blend.blended_energy_tdn_pct
        },
        cost_difference_daily_inr=cost_diff,
        margin_difference_daily_inr=margin_diff,
        nutritional_tradeoffs=tradeoffs,
        risk_notes=risk_notes,
        assumptions_and_limitations=assumptions,
        eligible_under_budget=eligible,
        budget_inr=payload.budget_inr,
        data_mode=settings.DATA_MODE
    )

@router.get("/decisions", response_model=DecisionHistoryResponse)
def get_decisions():
    """Returns history of analyzed and saved decisions with any recorded outcomes."""
    decisions = decision_service.get_all_decisions()
    items = [DecisionHistoryItem(**d) for d in decisions]
    return DecisionHistoryResponse(
        total_decisions=len(items),
        decisions=items
    )

@router.post("/decisions")
def save_decision_choice(payload: SaveDecisionRequest):
    """Saves a completed decision and the farmer's chosen action to the database."""
    decision_service.select_strategy_by_farmer(
        decision_id=payload.decision_id,
        selected_strategy_id=payload.selected_strategy_id,
        farmer_notes=payload.farmer_notes
    )
    return {
        "status": "success",
        "message": f"Strategy '{payload.selected_strategy_id}' recorded for decision '{payload.decision_id}'.",
        "decision_id": payload.decision_id,
        "selected_strategy_id": payload.selected_strategy_id
    }

@router.post("/decisions/{decision_id}/outcome", response_model=RecordOutcomeResponse)
def record_outcome(
    decision_id: str = Path(..., description="Decision identifier"),
    payload: RecordOutcomeRequest = Body(...)
):
    """Records real-world outcome feedback from the farmer.
    Does NOT claim automatic ML learning from a single observation.
    """
    outcome_id = decision_service.record_outcome(
        decision_id=decision_id,
        action_taken=payload.action_taken,
        actual_cost_inr=payload.actual_cost_inr,
        observed_milk_change_litres=payload.observed_milk_change_litres,
        farmer_notes=payload.farmer_notes,
        outcome_rating=payload.outcome_rating
    )
    return RecordOutcomeResponse(
        decision_id=decision_id,
        recorded_at=datetime.now(timezone.utc).isoformat(),
        message="Actual outcome recorded successfully for future retrospective evaluation. No autonomous retraining triggered.",
        outcome_id=outcome_id
    )

# --- Voice AI & Groq Audio Transcription Endpoints ---

@router.post("/voice/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """Transcribes farmer spoken audio using Groq Whisper API (whisper-large-v3)."""
    try:
        content = await file.read()
        result = await voice_service.transcribe_audio_groq(
            content,
            filename=file.filename or "audio.webm",
            language=language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech transcription failed: {str(e)}")

class VoiceQueryRequest(BaseModel):
    query: str
    language: Optional[str] = "en-IN"
    farm_id: Optional[str] = "demo-farm-01"

@router.post("/voice/query")
async def process_voice_query_endpoint(payload: VoiceQueryRequest):
    """Processes farmer voice query through relevant agents, producing bilingual guidance."""
    try:
        result = await voice_service.process_voice_query(
            query=payload.query,
            language=payload.language or "en-IN",
            farm_id=payload.farm_id or "demo-farm-01"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice query processing failed: {str(e)}")

# --- In-App Notifications & SMS Gateway Endpoints ---

@router.get("/notifications")
def get_notifications_endpoint(farm_id: str = "demo-farm-01", unread_only: bool = False):
    """Returns in-app notifications for the farm."""
    return {
        "farm_id": farm_id,
        "notifications": sms_service.get_notifications(farm_id, unread_only)
    }

@router.post("/notifications/{notification_id}/read")
def mark_notification_read_endpoint(notification_id: str):
    """Marks a single notification as read."""
    success = sms_service.mark_notification_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"status": "success", "notification_id": notification_id, "is_read": True}

@router.post("/notifications/mark-all-read")
def mark_all_notifications_read_endpoint(farm_id: str = "demo-farm-01"):
    """Marks all notifications for a farm as read."""
    count = sms_service.mark_all_notifications_read(farm_id)
    return {"status": "success", "updated_count": count}

@router.get("/notifications/settings")
def get_notification_settings_endpoint(farm_id: str = "demo-farm-01"):
    """Gets farmer phone number and alert preferences."""
    return sms_service.get_notification_settings(farm_id)

class UpdateNotificationSettingsRequest(BaseModel):
    phone_number: str
    country_code: Optional[str] = "+91"
    sms_enabled: Optional[bool] = True
    preferred_language: Optional[str] = "en-IN"
    notify_milk_drop: Optional[bool] = True
    notify_heat_stress: Optional[bool] = True
    notify_vet_triage: Optional[bool] = True
    notify_decision_review: Optional[bool] = True

@router.put("/notifications/settings")
def update_notification_settings_endpoint(payload: UpdateNotificationSettingsRequest, farm_id: str = "demo-farm-01"):
    """Updates farmer phone number and alert preferences."""
    try:
        updated = sms_service.update_notification_settings(farm_id, payload.model_dump())
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class SendTestSMSRequest(BaseModel):
    phone_number: str
    message: Optional[str] = None
    language: Optional[str] = "en"
    notification_id: Optional[str] = None

@router.post("/notifications/sms/send-test")
async def send_test_sms_endpoint(payload: SendTestSMSRequest):
    """Sends or simulates a test SMS to an Indian mobile number."""
    default_msg = (
        "FarmWise Alert: Milk production dropped by 35 L on Day 11 following heatwave (THI 86.8). Check your dashboard for cooling actions."
        if payload.language != "kn"
        else "FarmWise ಎಚ್ಚರಿಕೆ: ಬಿಸಿಲಿನ ತಾಪಮಾನದಿಂದಾಗಿ ಹಾಲಿನ ಉತ್ಪಾದನೆ 35 ಲೀಟರ್ ಇಳಿಕೆಯಾಗಿದೆ. ಪರಿಶೀಲಿಸಲು FarmWise ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ."
    )
    msg_to_send = payload.message or default_msg
    try:
        res = await sms_service.send_sms(
            phone_number=payload.phone_number,
            message_text=msg_to_send,
            language=payload.language or "en",
            notification_id=payload.notification_id
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMS dispatch failed: {str(e)}")

@router.get("/notifications/sms/logs")
def get_sms_logs_endpoint(limit: int = 20):
    """Returns SMS audit logs."""
    return {"logs": sms_service.get_recent_sms_logs(limit)}
