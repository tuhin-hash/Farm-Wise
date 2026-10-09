# FarmWise API Contract & Integration Guide

**Base URL**: `http://localhost:8000`  
**CORS Allowed Origins**: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`  
**Version**: `1.0.0`  
**Data Mode**: `synthetic_demo` (Karnataka Dairy Herd Benchmark)

---

## Overview

FarmWise is a multi-agent decision engine designed for livestock farms. All financial calculations are deterministic, transparent, and grounded in synthetic demo data from Karnataka, India.

---

## Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and LLM configuration mode |
| `GET` | `/api/dashboard` | Farm identity, production metrics, weather, active alerts, flagged cows |
| `GET` | `/api/feeds` | Feed inventory with prices, crude protein (CP), TDN energy, and provenance |
| `POST` | `/api/decision/analyze` | Multi-agent decision engine execution via LangGraph |
| `POST` | `/api/decision/simulate` | What-if simulation for feed substitution, prices, and interventions |
| `GET` | `/api/decisions` | Historical decision queries and recorded outcomes |
| `POST` | `/api/decisions` | Save farmer's selected action for an analyzed decision |
| `POST` | `/api/decisions/{decision_id}/outcome` | Record real-world outcome feedback |

---

## 1. GET `/api/health`

Returns service health and whether live LLM or deterministic fallback mode is active.

### Response `200 OK`
```json
{
  "status": "healthy",
  "app_name": "FarmWise Decision Engine",
  "app_version": "1.0.0",
  "data_mode": "synthetic_demo",
  "llm_enabled": false,
  "llm_provider": "Deterministic Rule-Based / Demo Mode (No API key required)",
  "llm_model": "rule-based-engine",
  "timestamp": "2026-10-09T04:25:00.000000Z"
}
```

---

## 2. GET `/api/dashboard`

Retrieves farm overview, production trends, environmental conditions, and livestock alerts.

### Query Parameters
- `farm_id` (string, optional, default: `"demo-farm-01"`)

### Response `200 OK`
```json
{
  "farm_id": "demo-farm-01",
  "farm_name": "NammaHerd Dairy",
  "location": "Mandya District, Karnataka, India",
  "data_mode": "synthetic_demo",
  "provenance_note": "Synthetic benchmark dataset representing a typical semi-intensive dairy herd in Southern Karnataka experiencing summer thermal stress and feed cost inflation.",
  "animal_count": 24,
  "breeds": {
    "HF_Cross": 14,
    "Jersey_Cross": 7,
    "Gir_Indigenous": 3
  },
  "milk_sale_price_inr_per_litre": 38.0,
  "daily_production": {
    "current_litres": 410.0,
    "baseline_litres": 445.0,
    "trend_percentage": -7.87,
    "current_daily_revenue_inr": 15580.0,
    "baseline_daily_revenue_inr": 16910.0
  },
  "water_consumption": {
    "current_litres_per_cow": 64.0,
    "baseline_litres_per_cow": 78.0,
    "trend_percentage": -17.95,
    "alert_level": "WARNING",
    "observation": "Daily water intake per cow dropped from 78L to 64L during a period when high ambient heat typically demands an increase to 95L-110L."
  },
  "current_feed_ration": {
    "ration_name": "Standard High-Concentrate Summer Ration",
    "total_daily_feed_cost_inr": 5424.0,
    "cost_per_cow_per_day_inr": 226.0,
    "estimated_daily_margin_inr": 10156.0,
    "margin_assumptions": "Calculated as daily milk revenue (410L * ₹38 = ₹15,580) minus daily herd feed expenditure (₹5,424). Excludes fixed labour and electricity overheads.",
    "items": [
      {
        "feed_id": "feed-conc-01",
        "feed_name": "Commercial Dairy Concentrate (20% CP)",
        "quantity_kg_per_cow": 4.5,
        "unit_price_inr_per_kg": 33.0,
        "daily_cost_herd_inr": 3564.0,
        "price_change_note": "Recent price surge of +17.86% (from ₹28.0/kg to ₹33.0/kg)"
      }
    ]
  },
  "environmental_conditions": {
    "ambient_temperature_celsius": 35.5,
    "relative_humidity_percentage": 68.0,
    "thi_index": 86.8,
    "heat_stress_category": "MODERATE_TO_SEVERE",
    "shed_ventilation_type": "Naturally ventilated with partial corrugated tin roof",
    "recorded_at": "2026-05-14T14:30:00+05:30",
    "interpretation": "THI exceeds critical threshold of 72. High heat and humidity cause accelerated respiration, reduced rumination, and heat-induced milk yield suppression."
  },
  "active_alerts": [
    {
      "id": "alert-01",
      "severity": "HIGH",
      "category": "ENVIRONMENTAL_HEAT_STRESS",
      "message": "Ambient THI reached 86.8 (35.5°C, 68% RH). Severe heat stress index for lactating cows."
    }
  ],
  "animals_requiring_attention": [
    {
      "animal_tag": "KA-MAN-104",
      "breed": "HF Cross (2nd Lactation)",
      "days_in_milk": 84,
      "rectal_temperature_celsius": 39.9,
      "respiration_rate_bpm": 74,
      "appetite_observation": "Severe feed refusal (left 60% concentrate uneaten)",
      "suspected_issue": "Elevated thermal distress / systemic infection",
      "action_required": "Immediate veterinary physical examination; isolate under shaded misting stall; check for tick-borne hemoparasites.",
      "veterinary_escalation": true
    }
  ],
  "production_history_14d": [
    {
      "day": -13,
      "date": "2026-05-01",
      "milk_litres": 448.0,
      "avg_temp_c": 31.0,
      "water_litres_per_cow": 79.0
    }
  ]
}
```

---

## 3. GET `/api/feeds`

Returns catalog of feeds with nutritional profiles and regional spot prices.

### Response `200 OK`
```json
{
  "total_feeds": 9,
  "data_mode": "synthetic_demo",
  "feeds": [
    {
      "feed_id": "feed-conc-01",
      "name": "Commercial Dairy Concentrate (20% CP)",
      "category": "concentrate",
      "unit_price_inr_per_kg": 33.0,
      "baseline_price_inr_per_kg": 28.0,
      "dry_matter_pct": 90.0,
      "crude_protein_pct": 20.2,
      "energy_tdn_pct": 72.0,
      "energy_me_mj_per_kg": 11.2,
      "calcium_pct": 1.2,
      "phosphorus_pct": 0.6,
      "availability": "high",
      "provenance": "Local grain merchant / feed cooperative invoice (Mandya, May 2026)",
      "notes": "Pelleted compounded feed for lactating dairy cattle. Price experienced an 17.86% inflation hike."
    }
  ]
}
```

---

## 4. POST `/api/decision/analyze`

Executes the LangGraph Multi-Agent Decision Engine.

### Request Body
```json
{
  "query": "Milk production has dropped and feed prices are rising. What should I do?",
  "farm_id": "demo-farm-01",
  "budget_inr": 5000.0,
  "farmer_strategy": "Reduce concentrate feed and increase green fodder",
  "priorities": {
    "profitability": 0.7,
    "low_cost": 0.8,
    "animal_welfare": 1.0,
    "risk_reduction": 0.9,
    "operational_feasibility": 0.6
  }
}
```

### Response `200 OK`
```json
{
  "decision_id": "dec-a1b2c3d4",
  "farm_id": "demo-farm-01",
  "data_mode": "synthetic_demo",
  "query": "Milk production has dropped and feed prices are rising. What should I do?",
  "analysis_summary": "Multi-factor production decline investigation (heat stress, water reduction, feed inflation).",
  "selected_agents": [
    "orchestrator",
    "farm_data",
    "risk_environment",
    "nutrition",
    "finance",
    "decision"
  ],
  "execution_trace": [
    {
      "agent": "Orchestrator Agent",
      "status": "completed",
      "summary": "Detected intent 'PRODUCTION_DECLINE_AND_STRESS'. Selected 6 agents.",
      "timestamp": "2026-10-09T04:26:01.000000Z"
    }
  ],
  "evidence": {
    "farm_data": { "...": "..." },
    "risk_environment": { "...": "..." },
    "nutrition": { "...": "..." },
    "finance": { "...": "..." }
  },
  "candidate_strategies": [
    {
      "strategy_id": "strat-hybrid-synergistic",
      "name": "Hybrid Strategy: Smart Feed Dilution + Low-Cost Shading & Fresh Water Protocol",
      "description": "Synergistic dual-action plan: substitute 1.5kg concentrate with DORB and buffer salts...",
      "estimated_daily_cost_inr": 4744.0,
      "estimated_daily_revenue_inr": 16150.0,
      "estimated_daily_margin_inr": 11406.0,
      "relative_risk_level": "low",
      "operational_feasibility": "moderate",
      "expected_impact": "Simultaneously relieves feed inflation pressure and mitigates heat distress...",
      "advantages": ["Fits within ₹5,000 budget", "Delivers highest daily margin of ₹11,406.00"],
      "drawbacks": ["Requires twice-daily water trough hygiene"],
      "eligible": true,
      "ineligibility_reason": null,
      "veterinary_confirmation_required": true,
      "veterinary_confirmation_details": "Isolate cows KA-MAN-104 & KA-MAN-112 for physical clinical treatment.",
      "scores": {
        "affordability_score": 62.0,
        "animal_welfare_score": 88.0,
        "financial_impact_score": 77.0,
        "risk_score": 90.0,
        "feasibility_score": 72.0,
        "weighted_total": 78.4,
        "weights_applied": {
          "low_cost": 0.8,
          "animal_welfare": 1.0,
          "profitability": 0.7,
          "risk_reduction": 0.9,
          "operational_feasibility": 0.6
        },
        "scoring_formula": "Weighted Total = ((0.80 * 62.0) + (1.00 * 88.0) + ...) / 4.00 = 78.40"
      }
    }
  ],
  "recommended_strategy_id": "strat-hybrid-synergistic",
  "explanation": {
    "winner_name": "Hybrid Strategy: Smart Feed Dilution + Low-Cost Shading & Fresh Water Protocol",
    "why_recommended": "The strategy scored the highest weighted mark (78.40/100)...",
    "why_alternatives_ranked_lower": [
      "'Farmer's Traditional Approach' ranked lower because cutting concentrate without replacement risks acute negative energy balance...",
      "'Cooling & Water Intervention' was disqualified: Hard Constraint Violated: Daily expenditure of ₹5624.00 exceeds budget of ₹5000.00."
    ],
    "critical_tradeoffs": ["Direct intervention cost of ₹4,744.00/day vs continuing traditional ration (₹5,424.00/day)."],
    "sensitivity_to_priorities": "Priority Sensitivity: Increasing 'low_cost' above 0.95 shifts preference toward raw feed cutting..."
  },
  "assumptions": [
    "All calculations use deterministic arithmetic based on the synthetic Karnataka demo dairy farm records.",
    "Daily milk sales valued at ₹38.00 per litre."
  ],
  "missing_data": [
    "Individual stall-level water meters absent; water intake reflects total herd trough estimation."
  ],
  "safety_notes": [
    "Provide continuous clean, chilled/shaded fresh drinking water.",
    "Isolate Cow KA-MAN-104 and Cow KA-MAN-112 for urgent veterinarian diagnosis."
  ],
  "created_at": "2026-10-09T04:26:05.000000Z"
}
```

---

## 5. POST `/api/decision/simulate`

What-If scenario calculator.

### Request Body
```json
{
  "feed_a_id": "feed-conc-01",
  "feed_b_id": "feed-dorb-01",
  "substitution_percentage": 25.0,
  "animal_count": 24,
  "milk_sale_price_inr": 38.0,
  "daily_milk_production_litres": 410.0,
  "intervention_cost_inr": 130.0,
  "budget_inr": 5000.0,
  "current_feed_prices": {
    "feed-conc-01": 33.0,
    "feed-dorb-01": 16.0
  }
}
```

### Response `200 OK`
```json
{
  "feed_a": { "name": "Commercial Dairy Concentrate (20% CP)", "unit_price_inr_per_kg": 33.0 },
  "feed_b": { "name": "De-Oiled Rice Bran (DORB)", "unit_price_inr_per_kg": 16.0 },
  "substitution_percentage": 25.0,
  "animal_count": 24,
  "current_scenario": {
    "feed_cost_inr": 5418.0,
    "total_cost_inr": 5418.0,
    "daily_milk_litres": 410.0,
    "daily_revenue_inr": 15580.0,
    "daily_margin_inr": 10162.0
  },
  "alternative_scenario": {
    "feed_cost_inr": 4959.0,
    "intervention_cost_inr": 130.0,
    "total_cost_inr": 5089.0,
    "daily_milk_litres": 425.0,
    "daily_revenue_inr": 16150.0,
    "daily_margin_inr": 11061.0,
    "blended_concentrate_price_inr_per_kg": 28.75,
    "blended_crude_protein_pct": 18.4,
    "blended_energy_tdn_pct": 68.0
  },
  "cost_difference_daily_inr": -329.0,
  "margin_difference_daily_inr": 899.0,
  "nutritional_tradeoffs": {
    "price_difference_inr_per_kg": -17.0,
    "crude_protein_delta_pct": -7.2,
    "tradeoff_summary": ["Cost saving of ₹17.00/kg (51.5% reduction)."]
  },
  "risk_notes": [],
  "assumptions_and_limitations": ["Lactating herd size: 24 cows."],
  "eligible_under_budget": false,
  "budget_inr": 5000.0,
  "data_mode": "synthetic_demo"
}
```

---

## 6. GET `/api/decisions`

Retrieves saved decision queries and farmer outcomes.

### Response `200 OK`
```json
{
  "total_decisions": 1,
  "decisions": [
    {
      "decision_id": "dec-a1b2c3d4",
      "farm_id": "demo-farm-01",
      "created_at": "2026-10-09T04:26:05.000000Z",
      "query": "Milk production has dropped and feed prices are rising. What should I do?",
      "recommended_strategy_id": "strat-hybrid-synergistic",
      "selected_by_farmer_strategy_id": "strat-hybrid-synergistic",
      "farmer_notes": "Implemented partial DORB blend and water trough shade.",
      "status": "outcome_recorded",
      "outcomes": [
        {
          "id": 1,
          "recorded_at": "2026-10-09T04:30:00.000000Z",
          "action_taken": "Replaced 1kg concentrate with DORB and added trough shade cloth.",
          "actual_cost_inr": 4820.0,
          "observed_milk_change_litres": 12.5,
          "farmer_notes": "Cows drank significantly more water. Milk improved by 12.5L.",
          "outcome_rating": 5
        }
      ]
    }
  ]
}
```

---

## 7. POST `/api/decisions`

Records farmer's strategy selection.

### Request Body
```json
{
  "decision_id": "dec-a1b2c3d4",
  "farm_id": "demo-farm-01",
  "selected_strategy_id": "strat-hybrid-synergistic",
  "farmer_notes": "Starting tomorrow morning with 15% DORB and cleaning water troughs twice daily."
}
```

---

## 8. POST `/api/decisions/{decision_id}/outcome`

Records retrospective outcome observations.

### Request Body
```json
{
  "action_taken": "Adopted DORB substitution + trough cleaning.",
  "actual_cost_inr": 4790.0,
  "observed_milk_change_litres": 14.0,
  "farmer_notes": "Water consumption increased to 82L/cow. Herd respiration settled.",
  "outcome_rating": 5
}
```
