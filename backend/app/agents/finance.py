"""Finance and Scenario Agent for FarmWise.
Calculates deterministic costs, revenues, margins, and budget compliance
for all candidate decision strategies.
All calculations use deterministic Python functions.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.data_service import data_service
from app.tools.calculators import (
    calculate_herd_feed_cost,
    calculate_milk_revenue,
    calculate_daily_margin
)

class FinanceAgent:
    @staticmethod
    def execute(farm_id: str = "demo-farm-01", budget_inr: float = 5000.0) -> Dict[str, Any]:
        farm = data_service.get_farm(farm_id) or {}
        animal_count = int(farm.get("animal_count", 24))
        milk_price = float(farm.get("milk_sale_price_inr_per_litre", 38.0))
        current_ration = farm.get("current_feed_ration", {})
        current_feed_cost = float(current_ration.get("total_daily_feed_cost_inr", 5424.0))
        current_milk = float(farm.get("daily_production", {}).get("current_litres", 410.0))
        current_revenue = calculate_milk_revenue(current_milk, milk_price)
        current_margin = calculate_daily_margin(current_revenue, current_feed_cost)

        # ---------------------------------------------------------
        # Strategy 1: Farmer's Traditional Heuristic
        # "Cut concentrate by 2kg/cow, increase green fodder"
        # ---------------------------------------------------------
        s1_items = [
            {"quantity_kg_per_cow": 2.5, "unit_price_inr_per_kg": 33.0},   # Reduced concentrate
            {"quantity_kg_per_cow": 24.0, "unit_price_inr_per_kg": 2.5},   # Increased green fodder
            {"quantity_kg_per_cow": 5.0, "unit_price_inr_per_kg": 4.5},    # Dry fodder
            {"quantity_kg_per_cow": 0.15, "unit_price_inr_per_kg": 65.0}   # Mineral mix
        ]
        s1_feed_cost = calculate_herd_feed_cost(s1_items, animal_count)
        s1_intervention_cost = 0.0
        s1_total_cost = s1_feed_cost + s1_intervention_cost
        s1_expected_milk = 390.0  # Assumes energy deficit causes further 20L drop
        s1_revenue = calculate_milk_revenue(s1_expected_milk, milk_price)
        s1_margin = calculate_daily_margin(s1_revenue, s1_feed_cost, s1_intervention_cost)

        strategy_1 = {
            "id": "strat-farmer-traditional",
            "name": "Farmer's Traditional Approach: Reduce Concentrate & Increase Green Fodder",
            "description": "Cut commercial concentrate by 2.0 kg/cow (down to 2.5 kg) and compensate bulk with +6 kg/cow of green fodder.",
            "estimated_daily_cost_inr": s1_total_cost,
            "estimated_daily_revenue_inr": s1_revenue,
            "estimated_daily_margin_inr": s1_margin,
            "relative_risk_level": "high",
            "operational_feasibility": "easy",
            "raw_welfare_score": 45.0,
            "expected_impact": "Immediate feed cost reduction, but high biological probability of inducing negative energy balance and further reducing daily milk yield by ~20L.",
            "advantages": [
                f"Lowers daily feed expenditure to ₹{s1_total_cost:.2f} (saves ₹{current_feed_cost - s1_total_cost:.2f}/day).",
                "Fully within current operational familiarity; uses farm-grown green fodder."
            ],
            "drawbacks": [
                "Green Napier fodder contains 80% moisture; cannot replace high-energy concentrate density.",
                "High risk of body condition scoring (BCS) loss and subclinical ketosis in high-yielding cows.",
                "Does nothing to address environmental heat stress or low water intake."
            ],
            "evidence_supporting": [
                "Feed dataset indicates Napier provides only 8.5% CP and 58% TDN vs Concentrate's 20.2% CP and 72% TDN.",
                "NDDB nutritional standards: lactating cows require dense glucogenic precursors during hot periods."
            ],
            "assumptions": [
                "Assumes farm fodder plot has sufficient water to supply 24 kg/cow/day green grass.",
                "Assumes milk production falls from 410L to 390L due to nutritional deficit."
            ],
            "missing_information": [
                "Individual cow body condition score (BCS) baseline.",
                "Exact moisture content of the current green fodder harvest."
            ],
            "veterinary_confirmation_required": True,
            "veterinary_confirmation_details": "Consult veterinary nutritionist before reducing concentrate below 3.0 kg for cows producing >15L/day."
        }

        # ---------------------------------------------------------
        # Strategy 2: Feed Optimization (Partial Substitution)
        # ---------------------------------------------------------
        s2_items = [
            {"quantity_kg_per_cow": 3.0, "unit_price_inr_per_kg": 33.0},   # Commercial concentrate
            {"quantity_kg_per_cow": 1.2, "unit_price_inr_per_kg": 16.0},   # De-Oiled Rice Bran (DORB)
            {"quantity_kg_per_cow": 0.4, "unit_price_inr_per_kg": 24.5},   # Cracked Maize
            {"quantity_kg_per_cow": 18.0, "unit_price_inr_per_kg": 2.5},  # Green fodder
            {"quantity_kg_per_cow": 5.0, "unit_price_inr_per_kg": 4.5},    # Dry fodder
            {"quantity_kg_per_cow": 0.15, "unit_price_inr_per_kg": 65.0}   # Mineral mix
        ]
        s2_feed_cost = calculate_herd_feed_cost(s2_items, animal_count)
        s2_intervention_cost = 0.0
        s2_total_cost = s2_feed_cost + s2_intervention_cost
        s2_expected_milk = 412.0  # Stabilizes yield
        s2_revenue = calculate_milk_revenue(s2_expected_milk, milk_price)
        s2_margin = calculate_daily_margin(s2_revenue, s2_feed_cost, s2_intervention_cost)

        strategy_2 = {
            "id": "strat-feed-adjustment",
            "name": "Feed Adjustment: Partial Concentrate Substitution with DORB & Maize Grain",
            "description": "Reformulate concentrate allowance: replace 33% of expensive concentrate with a blend of low-cost DORB (₹16/kg) and energy-dense Cracked Maize (₹24.5/kg).",
            "estimated_daily_cost_inr": s2_total_cost,
            "estimated_daily_revenue_inr": s2_revenue,
            "estimated_daily_margin_inr": s2_margin,
            "relative_risk_level": "medium",
            "operational_feasibility": "moderate",
            "raw_welfare_score": 70.0,
            "expected_impact": "Reduces daily feed expenditure below ₹5,000 while preserving balanced dietary crude protein and energy levels.",
            "advantages": [
                f"Daily herd feed cost reduced to ₹{s2_total_cost:.2f} (saves ₹{current_feed_cost - s2_total_cost:.2f}/day).",
                "Maintains balanced rumen energy without severe nutrient starvation.",
                "Easily procured from local APMC grain markets."
            ],
            "drawbacks": [
                "Requires on-farm weighing and manual mixing of raw ingredients.",
                "Does not directly alleviate environmental heat stress or shed temperature."
            ],
            "evidence_supporting": [
                "DORB provides economical phosphorus and fiber at ₹16/kg.",
                "Maize grain provides 82% TDN to maintain starch fermentation."
            ],
            "assumptions": [
                "Spot prices of DORB and maize grain remain stable at ₹16/kg and ₹24.5/kg.",
                "Milk yield stabilizes at 412 L/day."
            ],
            "missing_information": [
                "Aflatoxin certification on current market batch of maize and DORB."
            ],
            "veterinary_confirmation_required": False,
            "veterinary_confirmation_details": None
        }

        # ---------------------------------------------------------
        # Strategy 3: Cooling & Water Infrastructure Intervention
        # ---------------------------------------------------------
        s3_items = current_ration.get("items", [])
        s3_feed_cost = current_feed_cost
        s3_intervention_cost = 200.0  # Daily electricity for fans/misting + trough hygiene
        s3_total_cost = s3_feed_cost + s3_intervention_cost
        s3_expected_milk = 430.0  # Assumes heat relief restores significant yield
        s3_revenue = calculate_milk_revenue(s3_expected_milk, milk_price)
        s3_margin = calculate_daily_margin(s3_revenue, s3_feed_cost, s3_intervention_cost)

        strategy_3 = {
            "id": "strat-cooling-water",
            "name": "Cooling & Water Intervention: Active Ventilation, Misting & Water Trough Hygiene",
            "description": "Maintain existing nutritional intake while directly attacking thermal distress: deploy shade nets, run 4 circulation fans with coarse misting, and sanitize water troughs twice daily.",
            "estimated_daily_cost_inr": s3_total_cost,
            "estimated_daily_revenue_inr": s3_revenue,
            "estimated_daily_margin_inr": s3_margin,
            "relative_risk_level": "low",
            "operational_feasibility": "moderate",
            "raw_welfare_score": 92.0,
            "expected_impact": "Directly lowers cow body heat, restores normal rumination and water consumption, driving biological recovery towards ~430 L/day.",
            "advantages": [
                "Directly targets the root environmental cause (THI 86.8).",
                "Restores depressed water consumption (currently down 17.9%).",
                "Significantly improves animal welfare and fertility."
            ],
            "drawbacks": [
                f"Total daily expenditure of ₹{s3_total_cost:.2f} exceeds standard budget of ₹{budget_inr:.2f}.",
                "Requires consistent electricity and minor initial plumbing."
            ],
            "evidence_supporting": [
                "Farm THI is 86.8 (moderate-to-severe stress); thermal cooling restores dry matter intake.",
                "Water intake drop of 17.9% is strongly correlated with heat-induced lethargy and unshaded troughs."
            ],
            "assumptions": [
                "Uninterrupted 3-phase farm power supply or generator available during peak heat (11 AM - 3 PM).",
                "Yield recovers to 430 L/day under thermal relief."
            ],
            "missing_information": [
                "Shed water line pressure and electrical load capacity."
            ],
            "veterinary_confirmation_required": False,
            "veterinary_confirmation_details": None
        }

        # ---------------------------------------------------------
        # Strategy 4: Hybrid Synergistic Strategy
        # "Smart Feed Dilution + Low-Cost Cooling & Fresh Water Protocol"
        # ---------------------------------------------------------
        s4_items = [
            {"quantity_kg_per_cow": 3.0, "unit_price_inr_per_kg": 33.0},   # Commercial concentrate
            {"quantity_kg_per_cow": 1.0, "unit_price_inr_per_kg": 16.0},   # DORB
            {"quantity_kg_per_cow": 18.0, "unit_price_inr_per_kg": 2.5},  # Green fodder
            {"quantity_kg_per_cow": 5.0, "unit_price_inr_per_kg": 4.5},    # Dry fodder
            {"quantity_kg_per_cow": 0.15, "unit_price_inr_per_kg": 65.0}   # Mineral & Buffer mix
        ]
        s4_feed_cost = calculate_herd_feed_cost(s4_items, animal_count)
        s4_intervention_cost = 130.0  # Low cost shading over troughs + shade cloth + periodic misting
        s4_total_cost = s4_feed_cost + s4_intervention_cost
        s4_expected_milk = 425.0  # Solid recovery
        s4_revenue = calculate_milk_revenue(s4_expected_milk, milk_price)
        s4_margin = calculate_daily_margin(s4_revenue, s4_feed_cost, s4_intervention_cost)

        strategy_4 = {
            "id": "strat-hybrid-synergistic",
            "name": "Hybrid Strategy: Smart Feed Dilution + Low-Cost Shading & Fresh Water Protocol",
            "description": "Synergistic dual-action plan: substitute 1.5kg concentrate with DORB and buffer salts (lowering feed bill to ₹4,614/day) and invest ₹130/day in agro-shade cloth, continuous cold borehole water, and wetting.",
            "estimated_daily_cost_inr": s4_total_cost,
            "estimated_daily_revenue_inr": s4_revenue,
            "estimated_daily_margin_inr": s4_margin,
            "relative_risk_level": "low",
            "operational_feasibility": "moderate",
            "raw_welfare_score": 88.0,
            "expected_impact": "Simultaneously relieves feed inflation pressure and mitigates heat distress. Fully fits within daily budget while delivering peak net margin.",
            "advantages": [
                f"Total daily expenditure of ₹{s4_total_cost:.2f} fits within ₹{budget_inr:.2f} budget.",
                f"Delivers highest estimated daily operating margin of ₹{s4_margin:.2f} (+₹{s4_margin - current_margin:.2f}/day improvement).",
                "Balances animal hydration, rumen buffering, and operational feasibility."
            ],
            "drawbacks": [
                "Requires coordinated execution of both feed mixing and twice-daily trough cleaning routines."
            ],
            "evidence_supporting": [
                "Combines proven cost dilution of DORB with low-cost passive evaporative cooling.",
                "Rumen buffer prevents acidosis while cool water restores 14-day hydration deficit."
            ],
            "assumptions": [
                "Adequate borehole ground water supply for trough refilling and sprinkling.",
                "Milk yield stabilizes and recovers to 425 L/day with reduced thermal load."
            ],
            "missing_information": [
                "Current bacterial count of the farm water source."
            ],
            "veterinary_confirmation_required": True,
            "veterinary_confirmation_details": "Confirm mineral mixture dosage with local veterinarian and isolate cows KA-MAN-104 & KA-MAN-112 for separate clinical treatment."
        }

        candidate_strategies = [strategy_1, strategy_2, strategy_3, strategy_4]

        return {
            "animal_count": animal_count,
            "milk_sale_price_inr": milk_price,
            "current_feed_cost_inr": current_feed_cost,
            "current_revenue_inr": current_revenue,
            "current_margin_inr": current_margin,
            "budget_inr": budget_inr,
            "candidate_strategies": candidate_strategies,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

finance_agent = FinanceAgent()
