"""Feed comparison and nutritional trade-off analysis tools.
Evaluates cost-efficiency per unit of protein and energy.
"""

from typing import Dict, Any, List

def analyze_nutritional_tradeoffs(
    baseline_feed: Dict[str, Any],
    alternative_feed: Dict[str, Any]
) -> Dict[str, Any]:
    """Compares two feeds and returns deterministic trade-off analysis."""
    p_base = float(baseline_feed.get("unit_price_inr_per_kg", 0.0))
    p_alt = float(alternative_feed.get("unit_price_inr_per_kg", 0.0))
    price_diff_per_kg = round(p_alt - p_base, 2)
    price_pct_change = round(((p_alt - p_base) / p_base * 100.0) if p_base > 0 else 0.0, 1)

    cp_base = float(baseline_feed.get("crude_protein_pct", 0.0))
    cp_alt = float(alternative_feed.get("crude_protein_pct", 0.0))
    cp_diff = round(cp_alt - cp_base, 2)

    tdn_base = float(baseline_feed.get("energy_tdn_pct", 0.0))
    tdn_alt = float(alternative_feed.get("energy_tdn_pct", 0.0))
    tdn_diff = round(tdn_alt - tdn_base, 2)

    # Cost per 100g Crude Protein
    cost_per_100g_cp_base = round((p_base / (cp_base * 10)) * 100, 2) if cp_base > 0 else 0.0
    cost_per_100g_cp_alt = round((p_alt / (cp_alt * 10)) * 100, 2) if cp_alt > 0 else 0.0

    # Key trade-offs
    tradeoffs = []
    if price_diff_per_kg < 0:
        tradeoffs.append(f"Cost saving of ₹{abs(price_diff_per_kg):.2f}/kg ({abs(price_pct_change):.1f}% reduction).")
    elif price_diff_per_kg > 0:
        tradeoffs.append(f"Cost increase of ₹{price_diff_per_kg:.2f}/kg (+{price_pct_change:.1f}%).")
    else:
        tradeoffs.append("Identical purchase price per kg.")

    if cp_diff < 0:
        tradeoffs.append(f"Crude protein deficit of {abs(cp_diff):.1f}% percentage points; risk of milk protein drop unless supplemented.")
    elif cp_diff > 0:
        tradeoffs.append(f"Crude protein boost of +{cp_diff:.1f}% percentage points.")

    if tdn_diff < 0:
        tradeoffs.append(f"Energy (TDN) drop of {abs(tdn_diff):.1f}%; may reduce milk fat/volume if dry matter intake is constrained.")
    elif tdn_diff > 0:
        tradeoffs.append(f"Energy (TDN) increase of +{tdn_diff:.1f}%.")

    return {
        "baseline_feed_name": baseline_feed.get("name"),
        "alternative_feed_name": alternative_feed.get("name"),
        "price_difference_inr_per_kg": price_diff_per_kg,
        "price_percentage_change": price_pct_change,
        "crude_protein_delta_pct": cp_diff,
        "energy_tdn_delta_pct": tdn_diff,
        "cost_per_100g_protein": {
            "baseline_inr": cost_per_100g_cp_base,
            "alternative_inr": cost_per_100g_cp_alt
        },
        "tradeoff_summary": tradeoffs
    }
