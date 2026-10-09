import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.db.database import get_db_connection

class DecisionService:
    @staticmethod
    def save_decision_record(decision_data: Dict[str, Any]) -> str:
        """Persists analyzed decision into SQLite."""
        decision_id = decision_data.get("decision_id")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO decision_history (
                decision_id, farm_id, created_at, query, farmer_strategy,
                budget_inr, priorities_json, selected_agents_json, execution_trace_json,
                evidence_json, candidate_strategies_json, recommended_strategy_id,
                explanation_json, assumptions_json, missing_data_json, safety_notes_json,
                data_mode, selected_by_farmer_strategy_id, farmer_notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                decision_id,
                decision_data.get("farm_id", "demo-farm-01"),
                decision_data.get("created_at", datetime.now(timezone.utc).isoformat()),
                decision_data.get("query", ""),
                decision_data.get("farmer_strategy", ""),
                decision_data.get("budget_inr", 5000.0),
                json.dumps(decision_data.get("priorities", {})),
                json.dumps(decision_data.get("selected_agents", [])),
                json.dumps([step if isinstance(step, dict) else step.model_dump() for step in decision_data.get("execution_trace", [])]),
                json.dumps(decision_data.get("evidence", {})),
                json.dumps([strat if isinstance(strat, dict) else strat.model_dump() for strat in decision_data.get("candidate_strategies", [])]),
                decision_data.get("recommended_strategy_id", ""),
                json.dumps(decision_data.get("explanation", {}) if isinstance(decision_data.get("explanation"), dict) else decision_data.get("explanation").model_dump()),
                json.dumps(decision_data.get("assumptions", [])),
                json.dumps(decision_data.get("missing_data", [])),
                json.dumps(decision_data.get("safety_notes", [])),
                decision_data.get("data_mode", "synthetic_demo"),
                decision_data.get("selected_by_farmer_strategy_id"),
                decision_data.get("farmer_notes"),
                decision_data.get("status", "analyzed")
            ))
        return decision_id

    @staticmethod
    def select_strategy_by_farmer(decision_id: str, selected_strategy_id: str, farmer_notes: Optional[str] = None):
        """Updates decision record with the strategy actually chosen by the farmer."""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE decision_history
            SET selected_by_farmer_strategy_id = ?, farmer_notes = ?, status = 'selected'
            WHERE decision_id = ?
            """, (selected_strategy_id, farmer_notes, decision_id))

    @staticmethod
    def get_all_decisions() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT dh.*, 
                   (SELECT json_group_array(json_object(
                       'id', do.id,
                       'recorded_at', do.recorded_at,
                       'action_taken', do.action_taken,
                       'actual_cost_inr', do.actual_cost_inr,
                       'observed_milk_change_litres', do.observed_milk_change_litres,
                       'farmer_notes', do.farmer_notes,
                       'outcome_rating', do.outcome_rating
                   )) FROM decision_outcomes do WHERE do.decision_id = dh.decision_id) as outcomes_json
            FROM decision_history dh
            ORDER BY dh.created_at DESC
            """)
            rows = cursor.fetchall()
            results = []
            for row in rows:
                outcomes_raw = row["outcomes_json"]
                outcomes = json.loads(outcomes_raw) if outcomes_raw else []
                # Filter null array
                if outcomes and outcomes[0].get("id") is None:
                    outcomes = []

                results.append({
                    "decision_id": row["decision_id"],
                    "farm_id": row["farm_id"],
                    "created_at": row["created_at"],
                    "query": row["query"],
                    "farmer_strategy": row["farmer_strategy"],
                    "budget_inr": row["budget_inr"],
                    "recommended_strategy_id": row["recommended_strategy_id"],
                    "selected_by_farmer_strategy_id": row["selected_by_farmer_strategy_id"],
                    "farmer_notes": row["farmer_notes"],
                    "status": row["status"],
                    "candidate_strategies": json.loads(row["candidate_strategies_json"]) if row["candidate_strategies_json"] else [],
                    "outcomes": outcomes
                })
            return results

    @staticmethod
    def record_outcome(
        decision_id: str,
        action_taken: str,
        actual_cost_inr: Optional[float] = None,
        observed_milk_change_litres: Optional[float] = None,
        farmer_notes: Optional[str] = None,
        outcome_rating: Optional[int] = None
    ) -> int:
        now_str = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO decision_outcomes (
                decision_id, recorded_at, action_taken, actual_cost_inr,
                observed_milk_change_litres, farmer_notes, outcome_rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                decision_id,
                now_str,
                action_taken,
                actual_cost_inr,
                observed_milk_change_litres,
                farmer_notes,
                outcome_rating
            ))
            outcome_id = cursor.lastrowid
            cursor.execute("UPDATE decision_history SET status = 'outcome_recorded' WHERE decision_id = ?", (decision_id,))
            return outcome_id

decision_service = DecisionService()
