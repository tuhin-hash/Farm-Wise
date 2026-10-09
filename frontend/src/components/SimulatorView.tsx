import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { FeedItem, SimulateScenarioResult } from '../types';

export interface SimulatorViewProps {
  onNavigateArena?: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onNavigateArena }) => {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [feedAId, setFeedAId] = useState('feed-conc-01');
  const [feedBId, setFeedBId] = useState('feed-dorb-01');
  const [subPct, setSubPct] = useState<number>(25);
  const [numAnimals] = useState<number>(24);
  const [milkPrice] = useState<number>(38.0);
  const [interventionCost, setInterventionCost] = useState<number>(130.0);
  const [budget, setBudget] = useState<number>(5000.0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulateScenarioResult | null>(null);

  // Load feeds catalog
  useEffect(() => {
    api.getFeeds()
      .then((data) => {
        setFeeds(data);
      })
      .catch((err) => console.error('Failed to load feeds', err));
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateScenario({
        feed_a_id: feedAId,
        feed_b_id: feedBId,
        substitution_percentage: subPct,
        animal_count: numAnimals,
        milk_sale_price_inr: milkPrice,
        intervention_cost_inr: interventionCost,
        budget_inr: budget
      });
      setSimResult(res);
    } catch (err: any) {
      setError(err.message || 'Simulation calculation failed');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or parameter changes
  useEffect(() => {
    runSimulation();
  }, [feedAId, feedBId, subPct, numAnimals, milkPrice, interventionCost, budget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">What-If Scenario Simulator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic arithmetic modeling of feed substitution percentages, daily expenditures, nutrient densities, and operating margins.
          </p>
        </div>
        {onNavigateArena && (
          <button
            onClick={onNavigateArena}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl transition shadow"
          >
            <span>Run Decision Arena</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Simulator Inputs & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Substitution Controls
            </h2>
            {loading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
          </div>

          {/* Feed A Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Baseline Feed A (To Replace)
            </label>
            <select
              value={feedAId}
              onChange={(e) => setFeedAId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {feeds.map((f) => (
                <option key={f.feed_id} value={f.feed_id}>
                  {f.name} (₹{f.unit_price_inr_per_kg}/kg)
                </option>
              ))}
            </select>
          </div>

          {/* Feed B Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alternative Feed B (Substitute)
            </label>
            <select
              value={feedBId}
              onChange={(e) => setFeedBId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {feeds.map((f) => (
                <option key={f.feed_id} value={f.feed_id}>
                  {f.name} (₹{f.unit_price_inr_per_kg}/kg)
                </option>
              ))}
            </select>
          </div>

          {/* Substitution Slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Substitution Ratio:</span>
              <span className="text-emerald-400 font-mono text-sm">{subPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={subPct}
              onChange={(e) => setSubPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (100% Feed A)</span>
              <span>50% Blend</span>
              <span>100% (Pure Feed B)</span>
            </div>
          </div>

          {/* Daily Intervention Cost */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cooling / Environmental Intervention (₹/day)
            </label>
            <input
              type="number"
              value={interventionCost}
              onChange={(e) => setInterventionCost(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Fans, misting water, or trough shading operational expenses.
            </p>
          </div>

          {/* Budget Cap */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Daily Operating Budget Cap (₹)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {simResult && (
            <div className="space-y-4">
              {/* Top Delta Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Cost Difference</div>
                  <div className={`text-2xl font-black mt-1 font-mono ${simResult.cost_difference_daily_inr < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simResult.cost_difference_daily_inr < 0 ? '-' : '+'}₹{Math.abs(simResult.cost_difference_daily_inr).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {simResult.cost_difference_daily_inr < 0 ? 'Daily Savings' : 'Cost Increase'}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Margin Difference</div>
                  <div className={`text-2xl font-black mt-1 font-mono ${simResult.margin_difference_daily_inr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simResult.margin_difference_daily_inr >= 0 ? '+' : '-'}₹{Math.abs(simResult.margin_difference_daily_inr).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Net Daily Margin Delta
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Budget Compliance</div>
                  <div className="mt-1 flex items-center gap-2">
                    {simResult.eligible_under_budget ? (
                      <span className="px-3 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-xs font-bold rounded-full">
                        ✓ Within Budget (₹{budget.toLocaleString()})
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-950/60 text-rose-400 border border-rose-800 text-xs font-bold rounded-full">
                        ✕ Exceeds Budget
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Total: ₹{simResult.alternative_scenario.total_cost_inr.toLocaleString()}/day
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Scenario */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Baseline</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">100% {simResult.feed_a.name}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Herd Feed Cost:</span>
                      <span className="font-bold text-slate-200 font-mono">₹{simResult.current_scenario.feed_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intervention Cost:</span>
                      <span className="font-bold text-slate-200 font-mono">₹0.00</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-slate-100">
                      <span>Total Daily Expenditure:</span>
                      <span className="font-mono">₹{simResult.current_scenario.total_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Milk Output:</span>
                      <span className="font-bold text-slate-200 font-mono">{simResult.current_scenario.daily_milk_litres} L</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                      <span>Net Operating Margin:</span>
                      <span className="font-mono">₹{simResult.current_scenario.daily_margin_inr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Alternative Scenario */}
                <div className="bg-emerald-950/20 border border-emerald-800/40 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Simulated Alternative</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">{subPct}% Substitute Blend</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Blended Concentrate Price:</span>
                      <span className="font-bold text-slate-200 font-mono">₹{simResult.alternative_scenario.blended_concentrate_price_inr_per_kg?.toFixed(2)}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blended Crude Protein:</span>
                      <span className="font-bold text-slate-200 font-mono">{simResult.alternative_scenario.blended_crude_protein_pct?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Herd Feed Cost:</span>
                      <span className="font-bold text-slate-200 font-mono">₹{simResult.alternative_scenario.feed_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intervention (Cooling):</span>
                      <span className="font-bold text-slate-200 font-mono">+₹{simResult.alternative_scenario.intervention_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-slate-100">
                      <span>Total Daily Expenditure:</span>
                      <span className="font-mono">₹{simResult.alternative_scenario.total_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-black border-t border-slate-800 pt-1">
                      <span>Net Operating Margin:</span>
                      <span className="font-mono">₹{simResult.alternative_scenario.daily_margin_inr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nutritional Tradeoffs & Risk Notes */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nutritional Trade-Offs & Safeguards
                </h3>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {simResult.nutritional_tradeoffs.tradeoff_summary?.map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{t}</span>
                    </div>
                  ))}
                  {simResult.risk_notes.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-amber-300">
                      <span className="font-bold">⚠️</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
