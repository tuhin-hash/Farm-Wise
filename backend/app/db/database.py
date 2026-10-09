import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
from app.config import settings

def get_db_path() -> Path:
    db_file = Path(settings.DB_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    return db_file

@contextmanager
def get_db_connection():
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Farms table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS farms (
            farm_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            animal_count INTEGER NOT NULL,
            data_mode TEXT NOT NULL DEFAULT 'synthetic_demo',
            raw_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Feeds table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS feeds (
            feed_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit_price_inr_per_kg REAL NOT NULL,
            baseline_price_inr_per_kg REAL,
            dry_matter_pct REAL NOT NULL,
            crude_protein_pct REAL NOT NULL,
            energy_tdn_pct REAL NOT NULL,
            energy_me_mj_per_kg REAL,
            availability TEXT NOT NULL,
            provenance TEXT NOT NULL,
            notes TEXT,
            raw_json TEXT NOT NULL
        );
        """)

        # Animals table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS animals (
            animal_tag TEXT PRIMARY KEY,
            farm_id TEXT NOT NULL,
            breed TEXT NOT NULL,
            days_in_milk INTEGER,
            rectal_temperature_celsius REAL,
            respiration_rate_bpm INTEGER,
            appetite_observation TEXT,
            suspected_issue TEXT,
            veterinary_escalation INTEGER DEFAULT 0,
            raw_json TEXT NOT NULL,
            FOREIGN KEY (farm_id) REFERENCES farms (farm_id)
        );
        """)

        # Daily Observations table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id TEXT NOT NULL,
            record_date TEXT NOT NULL,
            milk_litres REAL NOT NULL,
            avg_temp_c REAL NOT NULL,
            water_litres_per_cow REAL NOT NULL,
            notes TEXT,
            FOREIGN KEY (farm_id) REFERENCES farms (farm_id)
        );
        """)

        # Decision History table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS decision_history (
            decision_id TEXT PRIMARY KEY,
            farm_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            query TEXT NOT NULL,
            farmer_strategy TEXT,
            budget_inr REAL,
            priorities_json TEXT,
            selected_agents_json TEXT,
            execution_trace_json TEXT,
            evidence_json TEXT,
            candidate_strategies_json TEXT,
            recommended_strategy_id TEXT,
            explanation_json TEXT,
            assumptions_json TEXT,
            missing_data_json TEXT,
            safety_notes_json TEXT,
            data_mode TEXT NOT NULL DEFAULT 'synthetic_demo',
            selected_by_farmer_strategy_id TEXT,
            farmer_notes TEXT,
            status TEXT NOT NULL DEFAULT 'analyzed'
        );
        """)

        # Decision Outcomes table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS decision_outcomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            decision_id TEXT NOT NULL,
            recorded_at TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            actual_cost_inr REAL,
            observed_milk_change_litres REAL,
            farmer_notes TEXT,
            outcome_rating INTEGER,
            FOREIGN KEY (decision_id) REFERENCES decision_history (decision_id)
        );
        """)
