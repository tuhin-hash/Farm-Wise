# FarmWise Backend & Decision Engine

> **Your experience. More evidence. Better farm decisions.**

FarmWise is a multi-agent decision-support platform for dairy farms. It combines synthetic farm records, live feed prices, nutritional profiles, environmental indicators (THI), and farmer priorities to compare candidate strategies in the **Decision Arena**.

---

## Features

- **Multi-Agent Orchestration via LangGraph**: Stateful graph execution with conditional routing between 6 specialized agents.
- **Decision Arena Engine**: Evaluates 4 candidate strategies (Farmer's traditional, Feed adjustment, Cooling/water intervention, and Hybrid synergistic strategy).
- **Deterministic Financial Calculators**: Exact Python arithmetic for herd feed expenditure, milk revenues, and net operating margins.
- **Transparent Multi-Criteria Scoring**: Weighted scoring (Affordability, Welfare, Financial impact, Risk, Feasibility) with hard budget constraints.
- **What-If Simulator**: Real-time simulation of feed substitution percentages, price shocks, and cooling investments.
- **Zero-Key Resilient Fallback**: Operates in full fidelity even without external LLM credentials.
- **Karnataka Dairy Benchmark**: Realistic synthetic dataset for a 24-cow dairy farm in Mandya, Karnataka.

---

## Prerequisites

- **Python**: Python 3.11+ (Python 3.12 recommended)
- **OS**: Windows (PowerShell commands documented below)

---

## Windows PowerShell Setup & Run Commands

### 1. Navigate to Backend Directory
```powershell
cd C:\Users\tuhin\Farm-Wise\backend
```

### 2. Create Virtual Environment
```powershell
python -m venv venv
```

### 3. Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```
*(If script execution is disabled in PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

### 4. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 5. Initialize & Seed SQLite Database
```powershell
python -m app.db.seed
```
*(Creates tables and seeds Karnataka demo farm records and Indian feed catalog into `app/data/farmwise.db`).*

### 6. Run Automated Pytest Suite
```powershell
pytest -v tests
```

### 7. Start the FastAPI Development Server
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server endpoints:
- **API Base**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Environment Variables (`.env`)

Copy `.env.example` to `backend/.env` or set environment variables:

```bash
ENVIRONMENT=development
PORT=8000
DATA_MODE=synthetic_demo

# Optional Groq API Key
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
```

If `GROQ_API_KEY` is not provided, the backend operates in deterministic rule-based demo mode without errors.

---

## Verification Commands (PowerShell)

### Test Health Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get | ConvertTo-Json
```

### Test Dashboard
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/dashboard" -Method Get | ConvertTo-Json -Depth 3
```

### Test Decision Arena Analysis
```powershell
$body = @{
    query = "Milk production has dropped and feed prices are rising. What should I do?"
    farm_id = "demo-farm-01"
    budget_inr = 5000
    farmer_strategy = "Reduce concentrate feed and increase green fodder"
    priorities = @{
        profitability = 0.7
        low_cost = 0.8
        animal_welfare = 1.0
        risk_reduction = 0.9
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/decision/analyze" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 4
```

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI entry point & CORS
│   ├── config.py                # Pydantic BaseSettings
│   ├── api/
│   │   └── routes.py            # API endpoints
│   ├── agents/
│   │   ├── orchestrator.py      # Intent parsing & conditional routing
│   │   ├── farm_data.py         # Herd data & missing-data warnings
│   │   ├── nutrition.py         # Feed economics & nutrient trade-offs
│   │   ├── risk_environment.py  # THI calculation & veterinary flags
│   │   ├── finance.py           # Deterministic financial modeling
│   │   └── decision.py          # Decision Arena scoring & explanation
│   ├── graph/
│   │   ├── state.py             # LangGraph state schema
│   │   └── workflow.py          # StateGraph nodes and edges
│   ├── tools/
│   │   ├── calculators.py       # Deterministic Python arithmetic
│   │   ├── feed_comparison.py   # Feed nutritional trade-offs
│   │   └── scoring.py           # Multi-criteria scoring engine
│   ├── models/
│   │   ├── requests.py          # Pydantic request schemas
│   │   └── responses.py         # Pydantic response schemas
│   ├── services/
│   │   ├── data_service.py      # SQLite queries
│   │   ├── llm_service.py       # Groq client & fallback
│   │   └── decision_service.py  # Decision history & outcomes
│   ├── db/
│   │   ├── database.py          # SQLite connection & DDL
│   │   └── seed.py              # Data seeder
│   └── data/
│       ├── demo_farm.json       # Karnataka dairy herd records
│       ├── feeds.json           # Feed ingredient catalog
│       └── farmwise.db          # SQLite database file
├── tests/                       # Pytest test suite (16 tests)
├── requirements.txt             # Python dependencies
└── README.md                    # Setup documentation
```
