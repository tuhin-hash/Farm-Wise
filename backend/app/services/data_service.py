import json
from typing import Dict, Any, List, Optional
from app.db.database import get_db_connection

class DataService:
    @staticmethod
    def get_farm(farm_id: str = "demo-farm-01") -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT raw_json FROM farms WHERE farm_id = ?", (farm_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row["raw_json"])
            # Fallback to any farm
            cursor.execute("SELECT raw_json FROM farms LIMIT 1")
            row = cursor.fetchone()
            return json.loads(row["raw_json"]) if row else None

    @staticmethod
    def get_feeds() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT raw_json FROM feeds ORDER BY unit_price_inr_per_kg DESC")
            rows = cursor.fetchall()
            return [json.loads(row["raw_json"]) for row in rows]

    @staticmethod
    def get_feed_by_id(feed_id: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT raw_json FROM feeds WHERE feed_id = ?", (feed_id,))
            row = cursor.fetchone()
            return json.loads(row["raw_json"]) if row else None

    @staticmethod
    def get_flagged_animals(farm_id: str = "demo-farm-01") -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT raw_json FROM animals WHERE farm_id = ? AND veterinary_escalation = 1", (farm_id,))
            rows = cursor.fetchall()
            return [json.loads(row["raw_json"]) for row in rows]

    @staticmethod
    def get_production_history(farm_id: str = "demo-farm-01", days: int = 14) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT record_date, milk_litres, avg_temp_c, water_litres_per_cow FROM daily_observations WHERE farm_id = ? ORDER BY record_date ASC LIMIT ?",
                (farm_id, days)
            )
            rows = cursor.fetchall()
            return [
                {
                    "date": row["record_date"],
                    "milk_litres": row["milk_litres"],
                    "avg_temp_c": row["avg_temp_c"],
                    "water_litres_per_cow": row["water_litres_per_cow"]
                }
                for row in rows
            ]

data_service = DataService()
