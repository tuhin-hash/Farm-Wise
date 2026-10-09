import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Award,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyzeDecisionResponse } from '../types';

export interface DecisionArenaProps {
  onDecisionSaved?: () => void;
  onNavigateHistory?: () => void;
  onNavigateSimulator?: () => void;
}

export const DecisionArenaView: React.FC<DecisionArenaProps> = ({
  onDecisionSaved,
  onNavigateHistory: _onNavigateHistory,
  onNavigateSimulator: _onNavigateSimulator
}) => {
  const [query, setQuery] = useState(
    "My dairy farm's milk production has declined, feed prices have increased, and the weather is hot. I have ₹5,000 available. Compare possible actions and recommend a practical strategy."
  );
  const [budget, setBudget] = useState<number>(5000);
  const [farmerStrategy, setFarmerStrategy] = useState("Reduce concentrate feed and increase green fodder");

  const [priorities, setPriorities] = useState<Record<string, number>>({
    profitability: 0.7,
    low_cost: 0.8,
    animal_welfare: 1.0,
    risk_reduction: 0.9,
    operational_feasibility: 0.6
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeDecisionResponse | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comparison' | 'trace' | 'explanation'>('comparison');

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await api.analyzeDecision({
        query,
        budget_inr: budget,
        farmer_strategy: farmerStrategy,
        priorities
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze decision');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStrategy = async (strategyId: string) => {
    if (!result) return;
    try {
      await api.saveDecisionChoice({
        decision_id: result.decision_id,
        selected_strategy_id: strategyId,
        farmer_notes: `Farmer adopted strategy ${strategyId} after Decision Arena evaluation.`
      });
      setSaveSuccess(`Strategy '${strategyId}' successfully saved to Decision History!`);
      onDecisionSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save strategy selection');
    }
  };

  const setTemplate = (templateType: 'summer_drop' | 'feed_only' | 'welfare_priority') => {
    if (templateType === 'summer_drop') {
      setQuery("My dairy farm's milk production has declined, feed prices have increased, and the weather is hot. I have ₹5,000 available. Compare possible actions and recommend a practical strategy.");
      setBudget(5000);
      setPriorities({ profitability: 0.7, low_cost: 0.8, animal_welfare: 1.0, risk_reduction: 0.9, operational_feasibility: 0.6 });
    } else if (templateType === 'feed_only') {
      setQuery("Commercial concentrate feed prices are rising rapidly. What alternative grain should I buy to lower costs?");
      setBudget(5200);
      setPriorities({ profitability: 0.9, low_cost: 1.0, animal_welfare: 0.4, risk_reduction: 0.5, operational_feasibility: 0.7 });
    } else {
      setQuery("Ambient temperatures are above 35°C and cows are panting heavily. Prioritize animal comfort and water intake.");
      setBudget(6000);
      setPriorities({ profitability: 0.4, low_cost: 0.3, animal_welfare: 1.0, risk_reduction: 1.0, operational_feasibility: 0.6 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Decision Arena</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Multi-agent strategy comparison engine: evaluates farmer heuristics against feed substitution, thermal mitigation, and hybrid strategies.
            </p>
          </div>
        </div>

        {/* Quick Query Templates */}
        <div className="mt-4 pt-4 border-t border-slate-700/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Scenarios:</span>
          <button
            onClick={() => setTemplate('summer_drop')}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-300 border border-slate-700 transition"
          >
            ☀️ Summer Heat + Feed Spike + Milk Drop
          </button>
          <button
            onClick={() => setTemplate('feed_only')}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-300 border border-slate-700 transition"
          >
            🌾 Feed Price Inflation Only
          </button>
          <button
            onClick={() => setTemplate('welfare_priority')}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-300 border border-slate-700 transition"
          >
            🐄 High Animal Welfare & Cooling
          </button>
        </div>
      </div>

      {/* Input Parameters Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query & Traditional Strategy */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Farmer Question or Problem Description
              </label>
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white text-slate-900"
                placeholder="Describe your current livestock situation..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Available Daily Operating Budget (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full text-sm pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-900 font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Strategies exceeding ₹{budget.toLocaleString()} will be automatically disqualified.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Farmer's Traditional Heuristic
                </label>
                <input
                  type="text"
                  value={farmerStrategy}
                  onChange={(e) => setFarmerStrategy(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Baseline habit tested in the Arena.
                </p>
              </div>
            </div>
          </div>

          {/* Priority Sliders */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Farmer Priority Weights
              </h2>
            </div>

            {Object.entries(priorities).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-semibold text-slate-700">
                    {key.replace('_', ' ')}:
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">{(val * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={val}
                  onChange={(e) =>
                    setPriorities({ ...priorities, [key]: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Orchestrating Agents via LangGraph...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Decision Arena Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error or Success notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Winner Showcase Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-green-950 rounded-2xl p-6 text-white border border-emerald-600 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  <Award className="w-4 h-4" />
                  <span>Recommended Winning Strategy</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {result.explanation.winner_name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {result.explanation.why_recommended}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <button
                  onClick={() => handleSaveStrategy(result.recommended_strategy_id)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Adopt This Strategy</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  Decision ID: {result.decision_id}
                </span>
              </div>
            </div>

            {/* Critical Trade-offs Bullet points */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
              {result.explanation.critical_tradeoffs.map((to, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{to}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
                activeTab === 'comparison'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Candidate Strategies ({result.candidate_strategies.length})
            </button>
            <button
              onClick={() => setActiveTab('trace')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
                activeTab === 'trace'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Agent Execution Trace ({result.execution_trace.length} Steps)
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition ${
                activeTab === 'explanation'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Explanations & Safeguards
            </button>
          </div>

          {/* TAB 1: Strategy Comparison Cards */}
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.candidate_strategies.map((strat, idx) => {
                const isWinner = strat.strategy_id === result.recommended_strategy_id;
                return (
                  <div
                    key={strat.strategy_id}
                    className={`rounded-2xl p-6 border transition flex flex-col justify-between ${
                      isWinner
                        ? 'bg-emerald-50/40 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : !strat.eligible
                        ? 'bg-slate-50 border-rose-300 opacity-90'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Strategy Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-slate-800 text-white font-mono">
                              Rank #{idx + 1}
                            </span>
                            {isWinner && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                                ⭐ Top Recommended
                              </span>
                            )}
                            {!strat.eligible && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                                Disqualified
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-base text-slate-900 mt-2">
                            {strat.name}
                          </h3>
                        </div>

                        {/* Weighted Score Badge */}
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-slate-900">
                            {strat.scores.weighted_total.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            Score / 100
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {strat.description}
                      </p>

                      {/* Ineligibility Reason */}
                      {!strat.eligible && (
                        <div className="p-3 bg-rose-100 text-rose-800 text-xs rounded-xl font-medium border border-rose-200">
                          🚫 {strat.ineligibility_reason}
                        </div>
                      )}

                      {/* Financial Metrics */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-center">
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Daily Cost</div>
                          <div className={`font-extrabold text-sm mt-0.5 ${strat.estimated_daily_cost_inr > budget ? 'text-rose-600' : 'text-slate-800'}`}>
                            ₹{strat.estimated_daily_cost_inr.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Revenue</div>
                          <div className="font-extrabold text-sm text-slate-800 mt-0.5">
                            ₹{strat.estimated_daily_revenue_inr?.toLocaleString() || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Net Margin</div>
                          <div className="font-extrabold text-sm text-emerald-700 mt-0.5">
                            ₹{strat.estimated_daily_margin_inr?.toLocaleString() || '-'}
                          </div>
                        </div>
                      </div>

                      {/* Attributes & Scores Breakdown */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Evaluation Scores
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Affordability:</span>
                            <span className="font-mono font-bold text-slate-800">{strat.scores.affordability_score.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Animal Welfare:</span>
                            <span className="font-mono font-bold text-slate-800">{strat.scores.animal_welfare_score.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Financial Impact:</span>
                            <span className="font-mono font-bold text-slate-800">{strat.scores.financial_impact_score.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Rating:</span>
                            <span className="font-mono font-bold text-slate-800">{strat.relative_risk_level.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Advantages & Drawbacks */}
                      <div className="space-y-1 pt-1 text-xs">
                        {strat.advantages.map((adv, aIdx) => (
                          <div key={aIdx} className="text-emerald-700 flex items-start gap-1.5">
                            <span className="font-bold">✓</span>
                            <span>{adv}</span>
                          </div>
                        ))}
                        {strat.drawbacks.map((drw, dIdx) => (
                          <div key={dIdx} className="text-slate-500 flex items-start gap-1.5">
                            <span className="font-bold">✕</span>
                            <span>{drw}</span>
                          </div>
                        ))}
                      </div>

                      {/* Veterinary flag */}
                      {strat.veterinary_confirmation_required && (
                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 font-medium">
                          ⚠️ Veterinary Consultation Required: {strat.veterinary_confirmation_details}
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleSaveStrategy(strat.strategy_id)}
                        disabled={!strat.eligible}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                          isWinner
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            : strat.eligible
                            ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Select Strategy</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Agent Execution Trace */}
          {activeTab === 'trace' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  LangGraph Agent Orchestration Pipeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real multi-agent flow trace: intent classification, conditional routing, data retrieval, and deterministic financial calculations.
                </p>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
                {result.execution_trace.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 ml-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold z-10 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">{step.agent}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Explanations & Assumptions */}
          {activeTab === 'explanation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Why Alternatives Ranked Lower */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Alternative Strategies Critique
                </h3>
                <div className="space-y-3">
                  {result.explanation.why_alternatives_ranked_lower.map((critique, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {critique}
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                  <span className="font-bold">Priority Sensitivity: </span>
                  {result.explanation.sensitivity_to_priorities}
                </div>
              </div>

              {/* Assumptions, Missing Data, and Safety */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Data Assumptions & Responsible AI Safeguards
                </h3>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Model Assumptions
                  </div>
                  {result.assumptions.map((assump, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-slate-400">•</span>
                      <span>{assump}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Missing Data Warnings
                  </div>
                  {result.missing_data.map((md, idx) => (
                    <div key={idx} className="text-xs text-amber-900 flex items-start gap-2">
                      <span className="text-amber-500 font-bold">!</span>
                      <span>{md}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    Veterinary Safety Directives
                  </div>
                  {result.safety_notes.map((sn, idx) => (
                    <div key={idx} className="text-xs text-rose-900 flex items-start gap-2">
                      <span className="text-rose-500 font-bold">🛡️</span>
                      <span>{sn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
