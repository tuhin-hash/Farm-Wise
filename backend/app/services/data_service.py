"""Data service — loads and serves demo farm and feed data from JSON files."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Any

DATA_DIR = Path(__file__).parent.parent / "data"

_farm_cache: Optional[Dict] = None
_feeds_cache: Optional[Dict] = None


def _load_json(filename: str) -> Dict:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def get_farm_data(farm_id: str = "demo-farm-01") -> Dict:
    """Return the full demo farm dataset."""
    global _farm_cache
    if _farm_cache is None:
        _farm_cache = _load_json("demo_farm.json")
    return _farm_cache


def get_feeds_data() -> Dict:
    """Return the full feeds dataset."""
    global _feeds_cache
    if _feeds_cache is None:
        _feeds_cache = _load_json("feeds.json")
    return _feeds_cache


def get_feed_by_id(feed_id: str) -> Optional[Dict]:
    """Look up a single feed by ID."""
    feeds = get_feeds_data()
    for f in feeds["feeds"]:
        if f["feed_id"] == feed_id:
            return f
    return None


def get_animals(farm_id: str = "demo-farm-01") -> List[Dict]:
    return get_farm_data(farm_id)["animals"]


def get_animals_with_flags(farm_id: str = "demo-farm-01") -> List[Dict]:
    """Return animals that have a health flag set."""
    return [a for a in get_animals(farm_id) if a.get("health_flag")]


def get_production_history(farm_id: str = "demo-farm-01") -> List[Dict]:
    return get_farm_data(farm_id)["production_history"]


def get_environment(farm_id: str = "demo-farm-01") -> List[Dict]:
    return get_farm_data(farm_id)["environment"]


def get_water_consumption(farm_id: str = "demo-farm-01") -> List[Dict]:
    return get_farm_data(farm_id)["water_consumption"]


def get_alerts(farm_id: str = "demo-farm-01") -> List[Dict]:
    return get_farm_data(farm_id)["alerts"]


def get_current_feed_plan(farm_id: str = "demo-farm-01") -> Dict:
    return get_farm_data(farm_id)["current_feed_plan"]


def get_production_trend(farm_id: str = "demo-farm-01") -> Dict[str, Any]:
    """Calculate production trend statistics."""
    history = get_production_history(farm_id)
    if len(history) < 2:
        return {"trend_pct": 0.0, "description": "Insufficient data"}
    first = history[0]["total_milk_litres"]
    last = history[-1]["total_milk_litres"]
    change_pct = round(((last - first) / first) * 100, 1)
    desc = "stable"
    if change_pct < -5:
        desc = "declining"
    elif change_pct < -2:
        desc = "slight decline"
    elif change_pct > 5:
        desc = "increasing"
    elif change_pct > 2:
        desc = "slight increase"
    return {
        "trend_pct": change_pct,
        "description": desc,
        "first_value": first,
        "last_value": last,
        "period_days": len(history),
    }


def get_water_trend(farm_id: str = "demo-farm-01") -> Dict[str, Any]:
    """Calculate water consumption trend."""
    water = get_water_consumption(farm_id)
    if len(water) < 2:
        return {"trend_pct": 0.0, "description": "Insufficient data"}
    first = water[0]["total_litres"]
    last = water[-1]["total_litres"]
    change_pct = round(((last - first) / first) * 100, 1)
    return {"trend_pct": change_pct, "first_value": first, "last_value": last}


def calculate_daily_feed_cost(farm_id: str = "demo-farm-01") -> Dict[str, Any]:
    """Calculate current daily feed cost from feed plan and prices."""
    plan = get_current_feed_plan(farm_id)
    animals = get_animals(farm_id)
    num_cows = len(animals)

    concentrate_feed = get_feed_by_id(plan["primary_concentrate"])
    green_feed = get_feed_by_id(plan["primary_green_fodder"])
    dry_feed = get_feed_by_id(plan["primary_dry_fodder"])
    mineral = get_feed_by_id("feed-mineral-mix")

    conc_cost = plan["concentrate_kg_per_cow"] * (concentrate_feed["current_price_inr_per_kg"] if concentrate_feed else 40)
    green_cost = plan["green_fodder_kg_per_cow"] * (green_feed["current_price_inr_per_kg"] if green_feed else 3)
    dry_cost = plan["dry_fodder_kg_per_cow"] * (dry_feed["current_price_inr_per_kg"] if dry_feed else 5)
    mineral_cost = (plan["mineral_mix_g_per_cow"] / 1000.0) * (mineral["current_price_inr_per_kg"] if mineral else 85)

    per_cow = round(conc_cost + green_cost + dry_cost + mineral_cost, 2)
    total = round(per_cow * num_cows, 2)

    return {
        "per_cow_inr": per_cow,
        "total_inr": total,
        "num_cows": num_cows,
        "breakdown": {
            "concentrate": round(conc_cost * num_cows, 2),
            "green_fodder": round(green_cost * num_cows, 2),
            "dry_fodder": round(dry_cost * num_cows, 2),
            "mineral_mix": round(mineral_cost * num_cows, 2),
        }
    }
