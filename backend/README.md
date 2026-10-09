# FarmWise Backend & Multi-Agent Decision Engine

> **Tagline:** *Your experience. More evidence. Better farm decisions.*

FarmWise is a multi-agent decision support platform for dairy farms. It combines synthetic farm records, live feed prices, nutritional profiles, environmental indicators (THI heat stress), and farmer priorities to compare viable operational strategies inside the **Decision Arena**.

---

## 1. Quick Start Guide (Windows PowerShell)

### Prerequisites
- Python 3.10+ (Verified on Python 3.11)
- Windows PowerShell

### Step 1: Clone or Navigate to Project
```powershell
cd C:\Users\Vishal\farm-wise\backend
```

### Step 2: (Optional) Create & Activate Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy the example environment file:
```powershell
Copy-Item ..\.env.example .env
```
*(Optional)* Add your `GROQ_API_KEY` to `.env` if you want live LLM natural language explanations. **No API key is required** — FarmWise operates out-of-the-box in deterministic demo mode.

### Step 5: Start the Backend Server
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will now be running at:
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Farm Dashboard:** [http://localhost:8000/api/dashboard](http://localhost:8000/api/dashboard)

---

## 2. Running Test Suite

FarmWise includes comprehensive automated tests covering deterministic calculations, scoring sensitivity, conditional routing, budget disqualification, fallback behavior, and API contract compliance.

To execute tests from the `backend/` directory:
```powershell
python -m pytest tests -v
```

---

## 3. Architecture & File Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application & CORS configuration
│   ├── api/
│   │   └── routes.py         # HTTP endpoint handlers (Health, Dashboard, Arena, Simulator, History)
│   ├── agents/
│   │   ├── orchestrator.py   # Intent classification & conditional agent routing
│   │   ├── farm_data.py      # Herd records & production/water trend analysis
│   │   ├── nutrition.py      # Feed comparisons, nutritional blending & warnings
│   │   ├── risk_environment.py # THI heat stress, water paradox & animal health triage
│   │   ├── finance.py        # Deterministic cost, revenue, and margin calculations
│   │   └── decision.py       # Decision Arena strategy synthesis & ranking
│   ├── graph/
│   │   ├── state.py          # FarmWiseState TypedDict definition
│   │   └── workflow.py       # LangGraph engine with modular stateful fallback runner
│   ├── tools/
│   │   ├── calculators.py    # Pure Python arithmetic financial calculators
│   │   ├── feed_comparison.py# Nutritional trade-off analysis
│   │   └── scoring.py        # Multi-attribute scoring & priority weighting engine
│   ├── models/
│   │   ├── requests.py       # Pydantic request validation models
│   │   └── responses.py      # Pydantic response models
│   ├── services/
│   │   ├── data_service.py   # Data access layer for demo dairy context
│   │   ├── llm_service.py    # Optional Groq/LangChain integration with graceful fallback
│   │   └── decision_service.py # Core orchestration service & SQLite persistence
│   ├── db/
│   │   ├── database.py       # SQLite connection manager & table definitions
│   │   └── seed.py           # Database seeder
│   └── data/
│       ├── demo_farm.json    # Synthetic 24-cow dairy farm in Mandya, Karnataka
│       └── feeds.json        # Karnataka feed market prices and nutritional values
├── tests/
│   ├── test_calculators.py   # Arithmetic & cost tests
│   ├── test_feed_comparison.py # Nutrition blending tests
│   ├── test_scoring.py       # Priority weighting & ranking tests
│   ├── test_orchestrator.py  # Intent-based conditional routing tests
│   ├── test_missing_data.py  # Missing data & safety disclaimer tests
│   ├── test_persistence.py   # SQLite decision history & outcome tests
│   ├── test_fallback.py      # Fallback operation tests without LLM key
│   └── test_api.py           # TestClient API endpoint tests
├── requirements.txt
└── README.md
```

---

## 4. Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and LLM/fallback mode |
| `GET` | `/api/dashboard` | Dairy metrics, 14-day milk trend, THI, alerts |
| `GET` | `/api/feeds` | Feed ingredients library, prices, and nutritional data |
| `POST` | `/api/decision/analyze` | Decision Arena: multi-agent query evaluation & strategy ranking |
| `POST` | `/api/decision/simulate` | What-if feed substitution simulator |
| `GET` | `/api/decisions` | Saved decision history with recorded outcomes |
| `POST` | `/api/decisions` | Save farmer chosen strategy |
| `POST` | `/api/decisions/{id}/outcome` | Record real-world outcome of a decision |

---

## 5. Security & Safety Principles

1. **No LLM Calculation:** All financial numbers and nutritional blends are calculated using verified Python functions. LLMs never calculate currency or nutritional values.
2. **Deterministic Fallback:** Full capability is preserved even without external API credentials or during network partitions.
3. **Veterinary Boundary:** FarmWise never diagnoses medical diseases or prescribes medication. High-risk situations trigger an explicit veterinary escalation notice.
