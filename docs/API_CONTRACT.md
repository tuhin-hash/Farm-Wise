# FarmWise API Contract

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api`  
**CORS Allowed Origins:** `http://localhost:5173`, `http://localhost:3000`, `*` (dev)  
**Data Mode:** `synthetic_demo` (Karnataka, India dairy farm context)

---

## 1. Overview & Principles

FarmWise provides evidence-based decision support for dairy farm management.
- All monetary values are in **INR (₹)**.
- Milk yield is measured in **litres**.
- Feed and nutritional quantities are measured in **kilograms (kg)** and **grams (g)**.
- Ambient temperatures are in **°Celsius (°C)**.
- **Safety Standard:** FarmWise provides decision support and comparative trade-off analysis. It does **not** provide clinical veterinary diagnoses or autonomous drug prescriptions.

---

## 2. Endpoints

### 2.1 System Health
`GET /api/health`

Returns service operational status and active LLM integration mode.

#### Response `200 OK`
```json
{
  "status": "ok",
  "mode": "demo",
  "version": "1.0.0",
  "message": "FarmWise backend running in deterministic demo mode (no LLM key required)."
}
```

- `status` (string): Service health indicator (`"ok"`).
- `mode` (string): Active engine mode (`"demo"` or `"llm"`).
- `version` (string): Backend API semantic version.
- `message` (string): Human-readable operational status message.

---

### 2.2 Farm Dashboard
`GET /api/dashboard?farm_id=demo-farm-01`

Fetches current synthetic farm status, production trends, environmental conditions, and alerts.

#### Query Parameters
- `farm_id` (string, optional, default: `"demo-farm-01"`): Target farm identifier.

#### Response `200 OK`
```json
{
  "farm": {
    "farm_id": "demo-farm-01",
    "name": "Nandini Dairy Farm",
    "location": "Mandya, Karnataka, India",
    "owner": "Rajesh Kumar",
    "data_mode": "synthetic_demo",
    "data_disclaimer": "All data is synthetic and for demonstration purposes only."
  },
  "data_mode": "synthetic_demo",
  "animal_count": 24,
  "animals_needing_attention": [
    {
      "animal_id": "COW-002",
      "name": "Ganga",
      "breed": "HF Crossbred",
      "age_years": 4,
      "avg_daily_milk_litres": 20.0,
      "current_daily_milk_litres": 18.0,
      "health_flag": "reduced_appetite",
      "notes": "Appetite decline noted last 3 days"
    },
    {
      "animal_id": "COW-004",
      "name": "Yamuna",
      "breed": "HF Crossbred",
      "age_years": 3,
      "avg_daily_milk_litres": 16.0,
      "current_daily_milk_litres": 14.0,
      "health_flag": "low_water_intake",
      "notes": "Water intake down ~20%"
    },
    {
      "animal_id": "COW-010",
      "name": "Annapurna",
      "breed": "HF Crossbred",
      "age_years": 3,
      "avg_daily_milk_litres": 15.5,
      "current_daily_milk_litres": 14.0,
      "health_flag": "mild_lameness",
      "notes": "Slight limp observed, monitor"
    }
  ],
  "daily_milk_litres": 408.0,
  "milk_trend_pct": -8.3,
  "milk_trend_description": "declining",
  "daily_feed_cost_inr": 8982.0,
  "estimated_daily_revenue_inr": 14280.0,
  "estimated_daily_margin_inr": 5298.0,
  "margin_assumptions": "Assumes ₹35.0/L milk sale price and current feed ration pricing.",
  "production_history": [
    {
      "date": "2026-09-25",
      "total_milk_litres": 445.0,
      "avg_per_cow": 18.54
    },
    {
      "date": "2026-10-08",
      "total_milk_litres": 408.0,
      "avg_per_cow": 17.0
    }
  ],
  "environment": [
    {
      "date": "2026-10-08",
      "max_temp_c": 38.1,
      "min_temp_c": 26.5,
      "humidity_pct": 75,
      "thi_index": 85,
      "heat_stress": "high"
    }
  ],
  "water_consumption": [
    {
      "date": "2026-10-08",
      "total_litres": 1900,
      "avg_per_cow_litres": 79.2
    }
  ],
  "alerts": [
    {
      "alert_id": "ALT-001",
      "type": "production_decline",
      "severity": "warning",
      "message": "Herd milk production declined ~8% over 14 days",
      "created_at": "2026-10-08"
    }
  ]
}
```

---

### 2.3 Available Feed Alternatives
`GET /api/feeds`

Returns library of feed ingredients, current and historical prices, nutritional profiles, and sourcing availability.

#### Response `200 OK`
```json
{
  "data_disclaimer": "Sample nutritional values for demonstration. Not verified laboratory analysis.",
  "feeds": [
    {
      "feed_id": "feed-soybean-meal",
      "name": "Soybean Meal",
      "category": "concentrate",
      "current_price_inr_per_kg": 45.0,
      "previous_price_inr_per_kg": 38.0,
      "price_change_pct": 18.4,
      "availability": "available",
      "nutrition_per_kg": {
        "crude_protein_pct": 44.0,
        "tdn_pct": 75.0,
        "crude_fibre_pct": 7.0,
        "calcium_pct": 0.3,
        "phosphorus_pct": 0.65,
        "metabolizable_energy_mcal": 2.65
      },
      "notes": "High-quality protein source. Price increase due to market conditions."
    }
  ]
}
```

---

### 2.4 Decision Arena Analysis
`POST /api/decision/analyze`

Executes multi-agent orchestrator, conditional agent analysis, candidate strategy synthesis, deterministic scoring, and recommendation.

#### Request Body
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
    "risk_reduction": 0.9
  }
}
```

- `query` (string, required): Farmer's problem statement.
- `farm_id` (string, optional, default: `"demo-farm-01"`).
- `budget_inr` (float, optional, default: `5000.0`): Daily intervention budget ceiling.
- `farmer_strategy` (string, optional): Farmer's traditional/proposed approach to evaluate alongside AI strategies.
- `priorities` (object): Priority weight coefficients (0.0 to 1.0):
  - `profitability` (float): Weight on revenue/margin.
  - `low_cost` (float): Weight on keeping operational costs low.
  - `animal_welfare` (float): Weight on cow health and comfort.
  - `risk_reduction` (float): Weight on avoiding risky or untested practices.

#### Response `200 OK`
```json
{
  "decision_id": "dec-f3a19b2c",
  "data_mode": "synthetic_demo",
  "analysis_summary": "Detected intent(s): production_decline, feed_cost. Routing to 5 agent(s).",
  "selected_agents": ["farm_data", "nutrition", "risk_environment", "finance", "decision"],
  "execution_trace": [
    {
      "agent_name": "orchestrator",
      "executed": true,
      "reason": "Analyzed query intent and planned agent execution route",
      "duration_ms": 2,
      "findings_summary": "Detected intent(s): production_decline, feed_cost."
    },
    {
      "agent_name": "farm_data",
      "executed": true,
      "reason": "Retrieved herd production, water intake, and animal flags",
      "duration_ms": 5,
      "findings_summary": "Current daily production: 408.0 litres. Trend: declining (-8.3%)."
    },
    {
      "agent_name": "nutrition",
      "executed": true,
      "reason": "Evaluated feed alternatives and nutritional differences",
      "duration_ms": 4,
      "findings_summary": "Best alternative: Cottonseed Meal at ₹30/kg (saves ₹15/kg)."
    },
    {
      "agent_name": "risk_environment",
      "executed": true,
      "reason": "Assessed THI heat stress, water trends, and animal health alerts",
      "duration_ms": 3,
      "findings_summary": "THI 85 indicates high heat stress. Water consumption declining."
    },
    {
      "agent_name": "finance",
      "executed": true,
      "reason": "Calculated costs, revenues, margins, and budget compliance",
      "duration_ms": 6,
      "findings_summary": "Current daily margin: ₹5298. Feed substitution saves ₹1080/day."
    },
    {
      "agent_name": "decision",
      "executed": true,
      "reason": "Evaluated candidate strategies in Decision Arena and computed ranking",
      "duration_ms": 8,
      "findings_summary": "Recommended: Hybrid: Feed Optimisation + Cooling"
    }
  ],
  "evidence": {
    "farm_data": {},
    "nutrition": {},
    "risk_environment": {},
    "finance": {}
  },
  "strategies": [
    {
      "strategy_id": "strategy-farmer",
      "name": "Farmer's Traditional Approach",
      "description": "Reduce concentrate feed and increase green fodder",
      "type": "farmer_traditional",
      "estimated_daily_cost_inr": 7634.7,
      "estimated_daily_revenue_inr": 14280.0,
      "estimated_daily_margin_inr": 6645.3,
      "risk_level": "medium",
      "feasibility": "easy",
      "expected_impact": "Lower feed costs, but potential further decline if protein intake drops.",
      "advantages": ["Low implementation effort", "Immediate cost reduction"],
      "drawbacks": ["May exacerbate protein deficiency", "Does not solve heat stress"],
      "evidence": [
        {"source": "farmer_input", "detail": "Farmer stated approach"}
      ],
      "assumptions": ["Concentrate reduced by 15%"],
      "missing_information": ["Exact fodder substitution quantities"],
      "requires_vet_confirmation": false,
      "requires_human_confirmation": true,
      "within_budget": true
    },
    {
      "strategy_id": "strategy-feed",
      "name": "Feed Adjustment: Partial Cottonseed Meal Substitution",
      "description": "Replace 50% soybean meal with cottonseed meal.",
      "type": "feed_adjustment",
      "estimated_daily_cost_inr": 7902.0,
      "estimated_daily_revenue_inr": 14280.0,
      "estimated_daily_margin_inr": 6378.0,
      "risk_level": "low",
      "feasibility": "moderate",
      "expected_impact": "Estimated daily saving of ₹1080. Protein changes by -8.0%.",
      "advantages": ["Direct feed cost reduction", "Locally available ingredient"],
      "drawbacks": ["Crude protein drops to 40%", "Gossypol limits inclusion to <=25-30%"],
      "evidence": [],
      "assumptions": ["50% substitution rate"],
      "missing_information": ["Batch aflatoxin lab certificate"],
      "requires_vet_confirmation": false,
      "requires_human_confirmation": true,
      "within_budget": true
    },
    {
      "strategy_id": "strategy-cooling",
      "name": "Cooling & Water Intervention",
      "description": "Misting fans, shade, and 24/7 clean water access.",
      "type": "cooling_water",
      "estimated_daily_cost_inr": 9782.0,
      "estimated_daily_revenue_inr": 14280.0,
      "estimated_daily_margin_inr": 4498.0,
      "risk_level": "low",
      "feasibility": "moderate",
      "expected_impact": "Directly targets THI 85 heat stress.",
      "advantages": ["Protects animal welfare", "Supports recovery of water intake"],
      "drawbacks": ["Additional operational expenditure ₹800/day"],
      "evidence": [],
      "assumptions": ["Cooling daily cost ₹800"],
      "missing_information": ["Exact farm fan infrastructure"],
      "requires_vet_confirmation": false,
      "requires_human_confirmation": true,
      "within_budget": true
    },
    {
      "strategy_id": "strategy-hybrid",
      "name": "Hybrid: Feed Optimisation + Cooling",
      "description": "Conservative 30% feed substitution combined with moderate cooling.",
      "type": "hybrid",
      "estimated_daily_cost_inr": 8834.0,
      "estimated_daily_revenue_inr": 14280.0,
      "estimated_daily_margin_inr": 5446.0,
      "risk_level": "low",
      "feasibility": "moderate",
      "expected_impact": "Saves on feed while protecting herd comfort.",
      "advantages": ["Balanced approach", "Mitigates heat stress with lower net cost impact"],
      "drawbacks": ["Multiple simultaneous changes require 14-day monitoring"],
      "evidence": [],
      "assumptions": ["30% substitution", "Cooling ₹500/day"],
      "missing_information": [],
      "requires_vet_confirmation": true,
      "requires_human_confirmation": true,
      "within_budget": true
    }
  ],
  "scoring": [
    {
      "strategy_id": "strategy-hybrid",
      "strategy_name": "Hybrid: Feed Optimisation + Cooling",
      "raw_scores": {
        "affordability": 65.0,
        "animal_welfare": 90.0,
        "financial_impact": 62.0,
        "risk": 90.0,
        "feasibility": 60.0
      },
      "weighted_scores": {
        "affordability": 52.0,
        "animal_welfare": 90.0,
        "financial_impact": 43.4,
        "risk": 81.0,
        "feasibility": 24.0
      },
      "total_score": 75.6,
      "rank": 1,
      "disqualified": false,
      "disqualification_reason": null
    }
  ],
  "scoring_method": "Weighted multi-criteria scoring with strict budget & welfare constraints",
  "recommended_strategy_id": "strategy-hybrid",
  "recommended_strategy_name": "Hybrid: Feed Optimisation + Cooling",
  "recommendation_explanation": "'Hybrid: Feed Optimisation + Cooling' is recommended (score: 75.6/100). Given your emphasis on animal welfare, this strategy scored highest overall.",
  "assumptions": [
    "All data is synthetic and for demonstration purposes",
    "Financial calculations use deterministic formulas, not LLM estimates",
    "Milk price: ₹35.0/litre"
  ],
  "missing_data": [],
  "safety_note": "⚠️ VETERINARY REVIEW RECOMMENDED: Multiple risk factors identified. This system provides decision support, not veterinary diagnosis.",
  "data_disclaimer": "Synthetic demo data for Karnataka dairy farm. Not a veterinary diagnostic."
}
```

---

### 2.5 What-If Simulator
`POST /api/decision/simulate`

Simulates interactive feed substitution scenarios with deterministic arithmetic.

#### Request Body
```json
{
  "farm_id": "demo-farm-01",
  "feed_a_id": "feed-soybean-meal",
  "feed_b_id": "feed-cottonseed-meal",
  "substitution_pct": 50.0,
  "num_animals": 24,
  "feed_quantity_kg_per_cow": 6.0,
  "milk_price_inr_per_litre": 35.0,
  "intervention_cost_inr_per_day": 0.0,
  "budget_inr": 5000.0,
  "priorities": {
    "profitability": 0.5,
    "low_cost": 0.8,
    "animal_welfare": 0.5,
    "risk_reduction": 0.5
  }
}
```

#### Response `200 OK`
```json
{
  "data_mode": "synthetic_demo",
  "current_scenario": {
    "label": "Current: 100% Soybean Meal",
    "feed_cost_per_cow_inr": 270.0,
    "total_daily_feed_cost_inr": 6480.0,
    "intervention_cost_inr": 0.0,
    "total_daily_cost_inr": 6480.0,
    "crude_protein_pct": 44.0,
    "tdn_pct": 75.0,
    "metabolizable_energy_mcal": 2.65
  },
  "alternative_scenario": {
    "label": "Alternative: 50% Soybean Meal + 50% Cottonseed Meal",
    "feed_cost_per_cow_inr": 225.0,
    "total_daily_feed_cost_inr": 5400.0,
    "intervention_cost_inr": 0.0,
    "total_daily_cost_inr": 5400.0,
    "crude_protein_pct": 40.0,
    "tdn_pct": 72.5,
    "metabolizable_energy_mcal": 2.55
  },
  "cost_difference_inr": -1080.0,
  "cost_difference_pct": -16.7,
  "nutritional_tradeoffs": [
    "Cottonseed Meal is ₹15.0/kg cheaper",
    "Protein drops by 8.0% — may reduce milk protein content",
    "Energy drops by 0.2 Mcal/kg — may affect milk yield"
  ],
  "margin_current_inr": 7800.0,
  "margin_alternative_inr": 8880.0,
  "margin_difference_inr": 1080.0,
  "within_budget": true,
  "risk_notes": [
    "Cottonseed meal contains gossypol: limiting to <= 25-30% inclusion is recommended."
  ],
  "assumptions": [
    "Synthetic herd estimate: 408.0 L milk/day @ ₹35.0/L",
    "Deterministic feed cost computation based on provided ingredient prices",
    "Assumes equal feed intake dry matter across both scenarios",
    "Biological milk response is not guaranteed and requires progressive dietary adaptation (7-10 days)"
  ],
  "limitations": [
    "Does not account for individual animal metabolic variation or micro-mineral interactions",
    "Market prices fluctuate; check local dealer quotes before bulk purchasing"
  ]
}
```

---

### 2.6 Saved Decision History
`GET /api/decisions?farm_id=demo-farm-01`

Fetches list of historical decisions and recorded outcomes.

#### Response `200 OK`
```json
{
  "decisions": [
    {
      "decision_id": "dec-f3a19b2c",
      "query": "Milk production has dropped and feed prices are rising. What should I do?",
      "farm_id": "demo-farm-01",
      "selected_strategy_id": "strategy-hybrid",
      "selected_strategy_name": "Hybrid: Feed Optimisation + Cooling",
      "analysis_summary": "Detected intent(s): production_decline, feed_cost.",
      "farmer_notes": "Implemented misting in barn section A and 30% cottonseed blend.",
      "created_at": "2026-10-09T05:15:00.000000",
      "outcome": {
        "actual_result": "Milk stabilized after 6 days; recovered 8 litres.",
        "milk_change_litres": 8.0,
        "cost_change_inr": -540.0,
        "satisfaction": 4,
        "notes": "Cows spent less time panting in afternoon.",
        "recorded_at": "2026-10-15T10:00:00.000000"
      }
    }
  ],
  "total": 1
}
```

---

### 2.7 Save Chosen Decision
`POST /api/decisions`

Saves the strategy chosen by the farmer for auditability and tracking.

#### Request Body
```json
{
  "decision_id": "dec-f3a19b2c",
  "query": "Milk production dropped and feed prices are rising.",
  "farm_id": "demo-farm-01",
  "selected_strategy_id": "strategy-hybrid",
  "selected_strategy_name": "Hybrid: Feed Optimisation + Cooling",
  "analysis_summary": "Multi-agent evaluation completed.",
  "farmer_notes": "Starting partial implementation on Monday."
}
```

---

### 2.8 Record Actual Outcome
`POST /api/decisions/{decision_id}/outcome`

Records what actually happened after executing the decision.

#### Request Body
```json
{
  "actual_result": "Milk production stabilized after 5 days of fan cooling.",
  "milk_change_litres": 8.5,
  "cost_change_inr": -420.0,
  "satisfaction": 4,
  "notes": "Good results; cows much calmer during afternoon heat."
}
```

#### Response `200 OK`
```json
{
  "status": "success",
  "decision_id": "dec-f3a19b2c",
  "actual_result": "Milk production stabilized after 5 days of fan cooling.",
  "recorded_at": "2026-10-15T12:00:00.000000",
  "message": "Outcome recorded. Note: FarmWise does not claim automatic learning from a single observation."
}
```
