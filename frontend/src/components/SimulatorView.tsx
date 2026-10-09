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
  const [numAnimals, setNumAnimals] = useState<number>(24);
  const [milkPrice, setMilkPrice] = useState<number>(38.0);
  const [interventionCost, setInterventionCost] = useState<number>(130.0);
  const [budget, setBudget] = useState<number>(5000.0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulateScenarioResult | null>(null);

  // Load feeds catalog
  useEffect(() => {
    api.getFeeds()
      .then((data) => setFeeds(data))
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

  useEffect(() => {
    runSimulation();
  }, [feedAId, feedBId, subPct, numAnimals, milkPrice, interventionCost, budget]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">What-If Scenario Simulator</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Deterministic arithmetic modeling of feed substitution ratios, crude protein densities, and net operating margins.
          </p>
        </div>

        {onNavigateArena && (
          <button
            onClick={onNavigateArena}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <span>Open Decision Arena</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Simulator Inputs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Substitution Controls
            </h2>
            {loading && <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />}
          </div>

          {/* Feed A Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Baseline Feed A (To Replace)
            </label>
            <select
              value={feedAId}
              onChange={(e) => setFeedAId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
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
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Alternative Feed B (Substitute)
            </label>
            <select
              value={feedBId}
              onChange={(e) => setFeedBId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            >
              {feeds.map((f) => (
                <option key={f.feed_id} value={f.feed_id}>
                  {f.name} (₹{f.unit_price_inr_per_kg}/kg)
                </option>
              ))}
            </select>
          </div>

          {/* Substitution Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-stone-700">Substitution Ratio:</span>
              <span className="text-emerald-800 font-mono text-sm">{subPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={subPct}
              onChange={(e) => setSubPct(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-medium">
              <span>0% (Pure A)</span>
              <span>50% Blend</span>
              <span>100% (Pure B)</span>
            </div>
          </div>

          {/* Financial Parameters */}
          <div className="pt-2 border-t border-stone-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Herd Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={numAnimals}
                  onChange={(e) => setNumAnimals(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono font-bold text-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Milk Price (₹/L)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={milkPrice}
                  onChange={(e) => setMilkPrice(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono font-bold text-stone-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Cooling Intervention Cost (₹/day)
              </label>
              <input
                type="number"
                value={interventionCost}
                onChange={(e) => setInterventionCost(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono font-bold text-stone-900 focus:bg-white"
              />
              <p className="text-[10px] text-stone-400 mt-1">Shading netting, fans, or trough water chilling.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Budget Cap (₹/day)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono font-bold text-stone-900 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {simResult && (
            <div className="space-y-6">
              {/* Top Delta Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Cost Difference</div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono ${
                    simResult.cost_difference_daily_inr < 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {simResult.cost_difference_daily_inr < 0 ? '-' : '+'}₹{Math.abs(simResult.cost_difference_daily_inr).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {simResult.cost_difference_daily_inr < 0 ? 'Daily Herd Savings' : 'Cost Increase / Day'}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Margin Difference</div>
                  <div className={`text-2xl sm:text-3xl font-black font-mono ${
                    simResult.margin_difference_daily_inr >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {simResult.margin_difference_daily_inr >= 0 ? '+' : '-'}₹{Math.abs(simResult.margin_difference_daily_inr).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Net Daily Operating Margin Delta
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Budget Status</div>
                  <div className="mt-1">
                    {simResult.eligible_under_budget ? (
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                        ✓ Within Budget (₹{budget.toLocaleString()})
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-300">
                        ✕ Exceeds Budget
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono mt-1">
                    Total: ₹{simResult.alternative_scenario.total_cost_inr.toLocaleString()}/day
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Baseline Scenario */}
                <div className="bg-stone-50/80 p-6 rounded-3xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Current Baseline</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                      100% {simResult.feed_a.name}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Concentrate Unit Price:</span>
                      <span className="font-bold text-stone-900 font-mono">₹{simResult.current_scenario.concentrate_unit_price_inr_per_kg?.toFixed(2)}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Herd Feed Cost:</span>
                      <span className="font-bold text-stone-900 font-mono">₹{simResult.current_scenario.feed_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intervention Cost:</span>
                      <span className="font-bold text-stone-900 font-mono">₹0.00</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900">
                      <span>Total Daily Cost:</span>
                      <span className="font-mono">₹{simResult.current_scenario.total_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily Revenue:</span>
                      <span className="font-bold text-stone-900 font-mono">₹{simResult.current_scenario.daily_revenue_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-black border-t border-stone-200 pt-2">
                      <span>Net Operating Margin:</span>
                      <span className="font-mono text-sm">₹{simResult.current_scenario.daily_margin_inr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Alternative Scenario */}
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-300 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Simulated Alternative</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                      {subPct}% Substitute Blend
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Blended Concentrate Price:</span>
                      <span className="font-bold text-emerald-900 font-mono">
                        ₹{simResult.alternative_scenario.blended_concentrate_price_inr_per_kg?.toFixed(2)}/kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blended Crude Protein (CP):</span>
                      <span className="font-bold text-emerald-900 font-mono">
                        {simResult.alternative_scenario.blended_crude_protein_pct?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Herd Feed Cost:</span>
                      <span className="font-bold text-stone-900 font-mono">₹{simResult.alternative_scenario.feed_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cooling Intervention:</span>
                      <span className="font-bold text-stone-900 font-mono">+₹{simResult.alternative_scenario.intervention_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-200 pt-2 font-bold text-stone-900">
                      <span>Total Daily Cost:</span>
                      <span className="font-mono">₹{simResult.alternative_scenario.total_cost_inr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-black border-t border-emerald-200 pt-2">
                      <span>Net Operating Margin:</span>
                      <span className="font-mono text-sm">₹{simResult.alternative_scenario.daily_margin_inr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nutritional Tradeoffs & Safeguards */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Nutritional Safeguards & Trade-Offs (ICAR & NRC Standards)
                </h3>

                <div className="space-y-2 text-xs text-stone-700">
                  {simResult.nutritional_tradeoffs.tradeoff_summary?.map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{t}</span>
                    </div>
                  ))}
                  {simResult.risk_notes.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-amber-800 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
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
