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

        # Seed Notifications
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE farm_id = ?", (demo_farm["farm_id"],))
        notifs_count = cursor.fetchone()[0]
        if notifs_count == 0 or force:
            cursor.execute("DELETE FROM notifications WHERE farm_id = ?", (demo_farm["farm_id"],))
            initial_notifications = [
                (
                    "notif-vet-104",
                    demo_farm["farm_id"],
                    "vet_triage",
                    "CRITICAL",
                    "Urgent Vet Triage: Cow KA-MAN-104",
                    "ತುರ್ತು ಪಶುವೈದ್ಯರ ಪರಿಶೀಲನೆ: ಹಸು KA-MAN-104",
                    "Rectal temperature 39.9°C, heart rate 105 BPM, and respiration 74 bpm indicate severe systemic heat distress. Immediate veterinary physical examination recommended.",
                    "ಗುದನಾಳದ ತಾಪಮಾನ 39.9°C, ನಾಡಿಮಿಡಿತ 105 BPM ಮತ್ತು ಉಸಿರಾಟ 74 bpm ತೀವ್ರ ಶಾಖದ ಒತ್ತಡವನ್ನು ಸೂಚಿಸುತ್ತದೆ. ತಕ್ಷಣ ಪಶುವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
                    "KA-MAN-104",
                    "overview",
                    0,
                    0,
                    None,
                    "NOT_SENT"
                ),
                (
                    "notif-milk-01",
                    demo_farm["farm_id"],
                    "milk_drop",
                    "HIGH",
                    "Daily Milk Yield Dropped by 35 Litres",
                    "ದೈನಂದಿನ ಹಾಲು ಉತ್ಪಾದನೆ 35 ಲೀಟರ್ ಇಳಿಕೆ",
                    "Herd milk production declined from 445 L baseline to 410 L/day (-7.87%) on Day 11 following summer heatwave onset.",
                    "ಬೇಸಿಗೆಯ ಬಿಸಿಲಿನ ತಾಪಮಾನದಿಂದಾಗಿ ದಿನ 11 ರಂದು ಹಾಲಿನ ಉತ್ಪಾದನೆ 445 ಲೀಟರ್‌ನಿಂದ 410 ಲೀಟರ್‌ಗೆ (35 ಲೀಟರ್) ಇಳಿಕೆಯಾಗಿದೆ.",
                    "Herd",
                    "trends",
                    0,
                    0,
                    None,
                    "NOT_SENT"
                ),
                (
                    "notif-heat-01",
                    demo_farm["farm_id"],
                    "heat_stress",
                    "WARNING",
                    "Moderate-to-Severe Heat Stress (THI 86.8)",
                    "ಮಧ್ಯಮ-ತೀವ್ರ ಶಾಖದ ಒತ್ತಡ (THI 86.8)",
                    "Ambient barn conditions reached 35.5°C and 68% RH. Water intake contracted by 18% vs heat requirement. Trough shading required.",
                    "ಕೊಟ್ಟಿಗೆಯ ತಾಪಮಾನ 35.5°C ಮತ್ತು ತೇವಾಂಶ 68% ತಲುಪಿದೆ. ನೀರಿನ ತೊಟ್ಟಿಗಳಿಗೆ ನೆರಳು ಮತ್ತು ಫ್ಯಾನ್ ಗಾಳಿ ಒದಗಿಸಿ.",
                    "Shed",
                    "overview",
                    0,
                    0,
                    None,
                    "NOT_SENT"
                ),
                (
                    "notif-feed-01",
                    demo_farm["farm_id"],
                    "decision_review",
                    "INFO",
                    "Commercial Concentrate Price Increased to ₹34/kg",
                    "ಮಾರುಕಟ್ಟೆ ಹಿಂಡಿ ಆಹಾರ ಬೆಲೆ ₹34/ಕೆಜಿಗೆ ಏರಿಕೆ",
                    "Dairy margin compressed. Open the Decision Arena to evaluate de-oiled rice bran (DORB) cost-saving substitution.",
                    "ಆಹಾರ ವೆಚ್ಚ ಹೆಚ್ಚಾಗಿದೆ. ವೆಚ್ಚ ಕಡಿತಗೊಳಿಸಲು ಮತ್ತು ಪರ್ಯಾಯ ಸೂತ್ರಗಳನ್ನು ಹೋಲಿಸಲು ನಿರ್ಧಾರ ಅಖಾಡವನ್ನು ತೆರೆಯಿರಿ.",
                    "Feed",
                    "arena",
                    1,
                    0,
                    None,
                    "NOT_SENT"
                )
            ]
            for n in initial_notifications:
                cursor.execute("""
                INSERT INTO notifications (
                    id, farm_id, category, severity, title_en, title_kn,
                    message_en, message_kn, related_entity, action_tab,
                    is_read, sms_sent, sms_recipient, sms_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, n)

        # Seed Default Farmer Notification Settings
        cursor.execute("SELECT COUNT(*) FROM farmer_notification_settings WHERE farm_id = ?", (demo_farm["farm_id"],))
        settings_count = cursor.fetchone()[0]
        if settings_count == 0 or force:
            cursor.execute("DELETE FROM farmer_notification_settings WHERE farm_id = ?", (demo_farm["farm_id"],))
            cursor.execute("""
            INSERT INTO farmer_notification_settings (
                farm_id, phone_number, country_code, sms_enabled, preferred_language,
                notify_milk_drop, notify_heat_stress, notify_vet_triage, notify_decision_review
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                demo_farm["farm_id"],
                "9876543210",
                "+91",
                1,
                "en-IN",
                1,
                1,
                1,
                1
            ))

if __name__ == "__main__":
    seed_database(force=True)
    print("Database initialized and seeded successfully.")
