import json
from pathlib import Path
from app.config import settings
from app.db.database import get_db_connection, init_db

def seed_database(force: bool = False):
    init_db()

    demo_farm_path = Path(settings.DEMO_FARM_FILE)
    feeds_path = Path(settings.FEEDS_FILE)

    if not demo_farm_path.exists() or not feeds_path.exists():
        raise FileNotFoundError("Demo data JSON files missing.")

    with open(demo_farm_path, "r", encoding="utf-8") as f:
        demo_farm = json.load(f)

    with open(feeds_path, "r", encoding="utf-8") as f:
        feeds = json.load(f)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check if farm already exists
        cursor.execute("SELECT COUNT(*) FROM farms WHERE farm_id = ?", (demo_farm["farm_id"],))
        farm_exists = cursor.fetchone()[0] > 0

        if not farm_exists or force:
            cursor.execute("DELETE FROM farms WHERE farm_id = ?", (demo_farm["farm_id"],))
            cursor.execute("""
            INSERT INTO farms (farm_id, name, location, animal_count, data_mode, raw_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                demo_farm["farm_id"],
                demo_farm["farm_name"],
                demo_farm["location"],
                demo_farm["animal_count"],
                demo_farm["data_mode"],
                json.dumps(demo_farm)
            ))

            # Seed Animals
            cursor.execute("DELETE FROM animals WHERE farm_id = ?", (demo_farm["farm_id"],))
            for animal in demo_farm.get("animals_requiring_attention", []):
                cursor.execute("""
                INSERT INTO animals (
                    animal_tag, farm_id, breed, days_in_milk, rectal_temperature_celsius,
                    respiration_rate_bpm, heart_rate_bpm, appetite_observation, suspected_issue,
                    veterinary_escalation, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    animal["animal_tag"],
                    demo_farm["farm_id"],
                    animal["breed"],
                    animal["days_in_milk"],
                    animal["rectal_temperature_celsius"],
                    animal["respiration_rate_bpm"],
                    animal.get("heart_rate_bpm"),
                    animal["appetite_observation"],
                    animal["suspected_issue"],
                    1 if animal.get("veterinary_escalation") else 0,
                    json.dumps(animal)
                ))

            # Seed Daily Observations
            cursor.execute("DELETE FROM daily_observations WHERE farm_id = ?", (demo_farm["farm_id"],))
            for obs in demo_farm.get("production_history_14d", []):
                cursor.execute("""
                INSERT INTO daily_observations (farm_id, record_date, milk_litres, avg_temp_c, water_litres_per_cow)
                VALUES (?, ?, ?, ?, ?)
                """, (
                    demo_farm["farm_id"],
                    obs["date"],
                    obs["milk_litres"],
                    obs["avg_temp_c"],
                    obs["water_litres_per_cow"]
                ))

        # Seed Feeds
        cursor.execute("SELECT COUNT(*) FROM feeds")
        feeds_count = cursor.fetchone()[0]
        if feeds_count == 0 or force:
            cursor.execute("DELETE FROM feeds")
            for feed in feeds:
                cursor.execute("""
                INSERT INTO feeds (
                    feed_id, name, category, unit_price_inr_per_kg, baseline_price_inr_per_kg,
                    dry_matter_pct, crude_protein_pct, energy_tdn_pct, energy_me_mj_per_kg,
                    availability, provenance, notes, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    feed["feed_id"],
                    feed["name"],
                    feed["category"],
                    feed["unit_price_inr_per_kg"],
                    feed.get("baseline_price_inr_per_kg"),
                    feed["dry_matter_pct"],
                    feed["crude_protein_pct"],
                    feed["energy_tdn_pct"],
                    feed.get("energy_me_mj_per_kg"),
                    feed["availability"],
                    feed["provenance"],
                    feed.get("notes", ""),
                    json.dumps(feed)
                ))

if __name__ == "__main__":
    seed_database(force=True)
    print("Database initialized and seeded successfully.")
