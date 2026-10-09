"""Seed the demo database (no-op for JSON-based demo data — decisions table only)."""
from app.db.database import init_db


def seed():
    """Initialize database tables. Demo farm/feed data comes from JSON files."""
    init_db()
    print("Database initialized successfully.")


if __name__ == "__main__":
    seed()
