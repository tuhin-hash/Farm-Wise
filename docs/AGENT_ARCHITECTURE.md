# FarmWise Multi-Agent Architecture

## 1. System Vision & Core Differentiator

**FarmWise** is a specialized multi-agent decision support engine designed for small and medium dairy farms in India (illustrated via Karnataka dairy context).

**Tagline:** *Your experience. More evidence. Better farm decisions.*

Traditional farm software provides either passive record-keeping or naive generic LLM chatbots that make unchecked guesses about animal rations and health. FarmWise solves this through the **Decision Arena**:
1. **Contextual Intake:** Farmer presents an issue in conversational natural language.
2. **Conditional Orchestration:** The Orchestrator plans which domain agents are genuinely needed, rather than executing every agent blindly.
3. **Evidence Retrieval:** Specialized agents retrieve verified farm records, compute water/milk trends, compare feed datasets, and analyze THI heat-stress indicators.
4. **Multi-Strategy Synthesis:** At least 4 distinct candidate actions are formulated, notably incorporating the farmer's traditional approach.
5. **Deterministic Arithmetic:** Quantitative costs, revenues, and margins are calculated strictly via deterministic Python modules, never delegated to LLM hallucination.
6. **Multi-Criteria Arena Scoring:** Transparent scoring weights affordability, animal welfare, profitability, and risk against the farmer's priorities.
7. **Traceability & Guardrails:** Full execution trace, transparent assumptions, missing-data warnings, and veterinary escalations are preserved and reported.

---

## 2. Multi-Agent Topology & State Flow

```
                     ┌────────────────────────┐
                     │ Farmer Query & Context │
                     └───────────┬────────────┘
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │   Orchestrator Agent   │
                     │  (Intent & Task Plan)  │
                     └───────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │ Conditional Route      │ Conditional Route      │ Conditional Route
        ▼                        ▼                        ▼
 ┌───────────────┐        ┌───────────────┐        ┌─────────────────────┐
 │   Farm Data   │        │   Nutrition   │        │  Risk & Environment │
 │     Agent     │        │     Agent     │        │        Agent        │
 └──────┬────────┘        └───────┬───────┘        └──────────┬──────────┘
        │                         │                           │
        └─────────────────────────┼───────────────────────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │     Finance Agent      │
                     │  (Deterministic Math)  │
                     └───────────┬────────────┘
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │     Decision Agent     │
                     │  (Decision Arena Core) │
                     └───────────┬────────────┘
                                 │
                                 ▼
                     ┌────────────────────────┐
                     │ Ranked Strategies &    │
                     │ Transparent Rationale  │
                     └────────────────────────┘
```

---

## 3. Specialized Agent Roles & Responsibilities

### A. Orchestrator Agent (`app/agents/orchestrator.py`)
- **Mission:** Natural language intent classification and conditional workflow planning.
- **Routing Rules:**
  - `feed_cost` / `feed_change`: Invokes `nutrition`, `finance`, `decision` (avoids unnecessary health queries).
  - `production_decline`: Invokes `farm_data`, `nutrition`, `risk_environment`, `finance`, `decision`.
  - `animal_health` / `water_issue`: Invokes `farm_data`, `risk_environment`, `decision`.
- **Failure Resilience:** Uses keyword and semantic heuristics in demo mode; can query Groq LLM when configured. Always produces a valid, typed routing plan.

### B. Farm Data Agent (`app/agents/farm_data.py`)
- **Mission:** Inspects herd observations, milk production records, and water consumption trends.
- **Evidence Gathered:**
  - Herd milk history over 14 days (calculating percentage delta and trend slope).
  - Flags individual cows (e.g., `COW-002` reduced appetite, `COW-010` mild lameness).
  - Distinguishes herd-wide declines (e.g. -8.3% across herd) from isolated individual cow abnormalities.
  - Flags missing data warnings if records are shorter than 7 days.

### C. Nutrition Agent (`app/agents/nutrition.py`)
- **Mission:** Feed alternative discovery, substitution evaluation, and nutritional balance analysis.
- **Evidence Gathered:**
  - Compares crude protein (CP%), Total Digestible Nutrients (TDN%), Metabolizable Energy (ME Mcal/kg), calcium, and phosphorus.
  - Computes weighted blended ration nutrition for substitutions (e.g. 50% soybean meal + 50% cottonseed meal).
  - Emits nutritional alerts (e.g., gossypol warning for cottonseed meal, aflatoxin screening recommendations, protein deficiency risks).
  - **Non-Hallucination Guard:** Never invents laboratory metrics; references curated feed records.

### D. Livestock Risk and Environment Agent (`app/agents/risk_environment.py`)
- **Mission:** Environmental heat stress monitoring, water intake paradox detection, and health triage.
- **Evidence Gathered:**
  - Temperature Humidity Index (THI): Flags moderate stress at THI 72-82, severe heat stress at THI >= 84.
  - Water Paradox Detection: Alerts when water consumption drops during high heat stress (indicating possible trough contamination or access failure).
  - Individual Cow Flags: Assesses risk levels and mitigation actions.
  - **Veterinary Guard:** Escalates to veterinary review whenever multiple severe risk factors co-occur. Explicitly disclaims medical diagnosis.

### E. Finance & Scenario Agent (`app/agents/finance.py`)
- **Mission:** Deterministic cost, revenue, and gross margin computation.
- **Evidence Gathered:**
  - Feed cost per cow per day and total daily herd feed bill.
  - Milk sale revenues at baseline farm prices (₹35/L).
  - Daily cost delta for partial feed substitutions.
  - Operational expenditure for cooling interventions (fans/misting).
  - Budget ceiling verification (`within_budget`, `overshoot_inr`).
- **Mathematical Integrity:** All calculations use standard Python functions in `app/tools/calculators.py` with zero reliance on LLM arithmetic.

### F. Decision Agent (`app/agents/decision.py`)
- **Mission:** Synthesizes candidate strategies, runs Decision Arena scoring, and explains trade-offs.
- **Strategies Formulated (Minimum 4):**
  1. *Farmer's Traditional Approach*: Evaluates the farmer's stated or habitual action (e.g. cutting concentrate, feeding extra fodder).
  2. *Feed Adjustment Strategy*: Cost-effective partial substitution with nutrient-preserving ratios.
  3. *Cooling & Water Intervention*: Environmental mitigation targeting THI heat stress.
  4. *Hybrid Strategy*: Balanced synergy (e.g., 30% feed substitution + moderate cooling).
- **Scoring System:**
  - Multi-attribute utility: Affordability, Animal Welfare, Financial Impact, Risk, Feasibility.
  - Dynamically weighted by farmer's input priority sliders.
  - Automatic disqualification for strategies violating hard budget limits or safety bounds.

---

## 4. State Management & Workflow Architecture

The multi-agent workflow is implemented in `app/graph/workflow.py` with state defined in `app/graph/state.py`.

- **Primary Engine:** LangGraph `StateGraph(FarmWiseState)`.
- **Modular Stateful Fallback Runner:** If LangGraph encounters package or environment incompatibilities, FarmWise automatically falls back to its built-in modular stateful runner. This runner executes the exact same node signatures, state transitions, and conditional checks without interrupting backend services.
- **Execution Trace:** Every node records execution status, duration in milliseconds, routing reasons, and findings summary.

---

## 5. Security & Secret Management

- Secrets (such as `GROQ_API_KEY`) are read strictly from process environment variables via `python-dotenv`.
- Secrets are never returned in HTTP responses, logged to disk, or committed to version control.
- If credentials are absent, the application gracefully operates in demo mode without warnings or failed requests.
