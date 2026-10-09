"""Feed comparison tools — nutritional analysis and substitution evaluation."""
from __future__ import annotations

from typing import Dict, List, Any, Optional


def compare_feeds(feed_a: Dict, feed_b: Dict) -> Dict[str, Any]:
    """Compare two feeds on price, protein, energy and other nutritional values."""
    na = feed_a["nutrition_per_kg"]
    nb = feed_b["nutrition_per_kg"]

    price_diff = round(feed_b["current_price_inr_per_kg"] - feed_a["current_price_inr_per_kg"], 2)
    protein_diff = round(nb["crude_protein_pct"] - na["crude_protein_pct"], 1)
    energy_diff = round(nb["metabolizable_energy_mcal"] - na["metabolizable_energy_mcal"], 2)
    tdn_diff = round(nb["tdn_pct"] - na["tdn_pct"], 1)
    fibre_diff = round(nb["crude_fibre_pct"] - na["crude_fibre_pct"], 1)

    tradeoffs = []
    if price_diff < 0:
        tradeoffs.append(f"{feed_b['name']} is ₹{abs(price_diff)}/kg cheaper")
    elif price_diff > 0:
        tradeoffs.append(f"{feed_b['name']} is ₹{price_diff}/kg more expensive")

    if protein_diff < -2:
        tradeoffs.append(f"Protein drops by {abs(protein_diff)}% — may reduce milk protein content")
    elif protein_diff > 2:
        tradeoffs.append(f"Protein increases by {protein_diff}% — potential nutritional benefit")

    if energy_diff < -0.2:
        tradeoffs.append(f"Energy drops by {abs(energy_diff)} Mcal/kg — may affect milk yield")
    elif energy_diff > 0.2:
        tradeoffs.append(f"Energy increases by {energy_diff} Mcal/kg")

    if feed_b.get("availability") == "limited":
        tradeoffs.append(f"{feed_b['name']} has limited availability — supply risk")

    return {
        "feed_a": {"id": feed_a["feed_id"], "name": feed_a["name"]},
        "feed_b": {"id": feed_b["feed_id"], "name": feed_b["name"]},
        "price_diff_inr": price_diff,
        "protein_diff_pct": protein_diff,
        "energy_diff_mcal": energy_diff,
        "tdn_diff_pct": tdn_diff,
        "fibre_diff_pct": fibre_diff,
        "tradeoffs": tradeoffs,
    }


def calculate_blended_nutrition(
    feed_a: Dict,
    feed_b: Dict,
    substitution_pct: float,
) -> Dict[str, float]:
    """Calculate weighted-average nutrition for a blended ration."""
    pct_b = substitution_pct / 100.0
    pct_a = 1.0 - pct_b
    na = feed_a["nutrition_per_kg"]
    nb = feed_b["nutrition_per_kg"]

    return {
        "crude_protein_pct": round(na["crude_protein_pct"] * pct_a + nb["crude_protein_pct"] * pct_b, 1),
        "tdn_pct": round(na["tdn_pct"] * pct_a + nb["tdn_pct"] * pct_b, 1),
        "crude_fibre_pct": round(na["crude_fibre_pct"] * pct_a + nb["crude_fibre_pct"] * pct_b, 1),
        "calcium_pct": round(na["calcium_pct"] * pct_a + nb["calcium_pct"] * pct_b, 2),
        "phosphorus_pct": round(na["phosphorus_pct"] * pct_a + nb["phosphorus_pct"] * pct_b, 2),
        "metabolizable_energy_mcal": round(
            na["metabolizable_energy_mcal"] * pct_a + nb["metabolizable_energy_mcal"] * pct_b, 2
        ),
    }


def find_cheaper_alternatives(
    current_feed: Dict,
    all_feeds: List[Dict],
    same_category: bool = True,
) -> List[Dict]:
    """Find feeds that are cheaper than the current one, optionally in the same category."""
    alternatives = []
    for f in all_feeds:
        if f["feed_id"] == current_feed["feed_id"]:
            continue
        if same_category and f["category"] != current_feed["category"]:
            continue
        if f["current_price_inr_per_kg"] < current_feed["current_price_inr_per_kg"]:
            comparison = compare_feeds(current_feed, f)
            alternatives.append({
                "feed": f,
                "comparison": comparison,
            })
    alternatives.sort(key=lambda x: x["feed"]["current_price_inr_per_kg"])
    return alternatives


def evaluate_feed_substitution(
    feed_a: Dict,
    feed_b: Dict,
    substitution_pct: float,
    kg_per_cow: float,
    num_cows: int,
) -> Dict[str, Any]:
    """Full evaluation of a feed substitution: cost, nutrition, tradeoffs."""
    from app.tools.calculators import calculate_substitution_cost

    cost = calculate_substitution_cost(
        feed_a["current_price_inr_per_kg"],
        feed_b["current_price_inr_per_kg"],
        kg_per_cow,
        substitution_pct,
        num_cows,
    )
    blended = calculate_blended_nutrition(feed_a, feed_b, substitution_pct)
    comparison = compare_feeds(feed_a, feed_b)

    return {
        "cost": cost,
        "blended_nutrition": blended,
        "original_nutrition": feed_a["nutrition_per_kg"],
        "comparison": comparison,
    }
