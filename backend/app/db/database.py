"""SQLite database setup and connection management for FarmWise."""
from __future__ import annotations

import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

DB_PATH = os.environ.get("DATABASE_URL", "sqlite:///./farmwise.db").replace("sqlite:///", "")
if not DB_PATH or DB_PATH == "./farmwise.db":
    DB_PATH = str(Path(__file__).parent.parent.parent / "farmwise.db")


def get_db_path() -> str:
    return DB_PATH


def init_db():
    """Create tables if they don't exist."""
    conn = sqlite3.connect(get_db_path())
    conn.execute("PRAGMA journal_mode=WAL")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            decision_id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            farm_id TEXT NOT NULL,
            selected_strategy_id TEXT NOT NULL,
            selected_strategy_name TEXT NOT NULL,
            analysis_summary TEXT DEFAULT '',
            full_response TEXT DEFAULT '',
            farmer_notes TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS outcomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            decision_id TEXT NOT NULL,
            actual_result TEXT NOT NULL,
            milk_change_litres REAL,
            cost_change_inr REAL,
            satisfaction INTEGER,
            notes TEXT DEFAULT '',
            recorded_at TEXT NOT NULL,
            FOREIGN KEY (decision_id) REFERENCES decisions(decision_id)
        )
    """)

    conn.commit()
    conn.close()


@contextmanager
def get_connection():
    """Yield a sqlite3 connection with row_factory set."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
