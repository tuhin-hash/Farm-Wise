import { useState } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Award,
  Loader2,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Check
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
  onNavigateHistory,
  onNavigateSimulator
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
    risk_tolerance: 0.6,
    operational_ease: 0.8
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDecisionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [farmerNotes, setFarmerNotes] = useState<string>('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);

  const applyPriorityPreset = (preset: 'balanced' | 'welfare' | 'cost' | 'profit') => {
    if (preset === 'balanced') {
      setPriorities({ profitability: 0.7, low_cost: 0.7, animal_welfare: 0.8, risk_tolerance: 0.6, operational_ease: 0.7 });
    } else if (preset === 'welfare') {
      setPriorities({ profitability: 0.5, low_cost: 0.5, animal_welfare: 1.0, risk_tolerance: 0.4, operational_ease: 0.8 });
    } else if (preset === 'cost') {
      setPriorities({ profitability: 0.8, low_cost: 1.0, animal_welfare: 0.6, risk_tolerance: 0.7, operational_ease: 0.9 });
    } else if (preset === 'profit') {
      setPriorities({ profitability: 1.0, low_cost: 0.6, animal_welfare: 0.7, risk_tolerance: 0.8, operational_ease: 0.6 });
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAnalyzing(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await api.analyzeDecision({
        query,
        budget_inr: budget,
        farmer_strategy: farmerStrategy,
        priorities
      });
      setAnalysisResult(res);
      setSelectedStrategyId(res.recommended_strategy_id);
      setExpandedStrategyId(res.recommended_strategy_id);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to complete multi-agent analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveChoice = async () => {
    if (!analysisResult || !selectedStrategyId) return;
    setSavingDecision(true);
    try {
      await api.saveDecisionChoice({
        decision_id: analysisResult.decision_id,
        selected_strategy_id: selectedStrategyId,
        farmer_notes: farmerNotes || 'Selected strategy based on multi-agent comparative trade-off arena.'
      });
      setSavedSuccess(true);
      setTimeout(() => {
        if (onDecisionSaved) onDecisionSaved();
      }, 1200);
    } catch (err: any) {
      alert(`Error saving choice: ${err.message}`);
    } finally {
      setSavingDecision(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Differentiator Callout */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Decision Arena</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Compare your traditional farming practice side-by-side with AI candidate strategies using deterministic math.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-stone-100 text-stone-700 font-bold rounded-xl border border-stone-200">
            Mandya 24-Cow Cohort
          </span>
          <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200">
            Budget Cap: ₹{budget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Farmer Problem Input & Priority Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Natural Language Query & Traditional Practice */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Farmer Problem Formulation
            </h2>
            <span className="text-xs text-stone-400">Natural Language Query</span>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Describe the Farm Challenge or Situation
              </label>
              <textarea
                rows={3}
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Milk production has declined by 35 L/day, feed prices jumped, and weather is hot..."
                className="w-full text-xs p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Available Daily Operating Budget (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="1000"
                    max="50000"
                    step="250"
                    required
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Options exceeding this budget are marked ineligible.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Farmer's Traditional / Existing Approach
                </label>
                <input
                  type="text"
                  required
                  value={farmerStrategy}
                  onChange={(e) => setFarmerStrategy(e.target.value)}
                  placeholder="e.g. Cut concentrate and add more green fodder"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
                <p className="text-[10px] text-stone-400 mt-1">Evaluated alongside AI proposals in the Arena.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={analyzing}
                className="w-full sm:w-auto px-7 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Orchestrating 6 Agents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Multi-Agent Arena Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Decision Priority Weights */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-700" />
              <span>Farmer Priorities</span>
            </h2>
            <span className="text-[10px] text-stone-400">Custom Weights</span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => applyPriorityPreset('welfare')}
              className="py-1 px-2 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              Welfare First
            </button>
            <button
              type="button"
              onClick={() => applyPriorityPreset('cost')}
              className="py-1 px-2 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
            >
              Cost Cutter
            </button>
            <button
              type="button"
              onClick={() => applyPriorityPreset('profit')}
              className="py-1 px-2 text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition"
            >
              Max Profit
            </button>
            <button
              type="button"
              onClick={() => applyPriorityPreset('balanced')}
              className="py-1 px-2 text-[10px] font-bold rounded-lg bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 transition"
            >
              Balanced
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2">
            {[
              { key: 'animal_welfare', label: 'Animal Welfare & Health', color: 'accent-emerald-600' },
              { key: 'profitability', label: 'Operating Margin & Milk Revenue', color: 'accent-emerald-600' },
              { key: 'low_cost', label: 'Low Daily Expenditure', color: 'accent-amber-600' },
              { key: 'operational_ease', label: 'Ease of Implementation', color: 'accent-stone-700' },
              { key: 'risk_tolerance', label: 'Risk Tolerance', color: 'accent-indigo-600' }
            ].map(({ key, label, color }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-stone-700">
                  <span>{label}</span>
                  <span className="font-mono text-emerald-800 font-bold">{Math.round((priorities[key] || 0.7) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={priorities[key] || 0.7}
                  onChange={(e) => setPriorities({ ...priorities, [key]: Number(e.target.value) })}
                  className={`w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer ${color}`}
                />
              </div>
            ))}
          </div>

          <p className="text-[10px] text-stone-400 italic pt-1">
            Priority weights dynamically calibrate the multi-attribute utility function in the Decision Agent.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Results Section */}
      {analysisResult ? (
        <div className="space-y-8">
          {/* Real-time Agent Execution Trace Bar */}
          <div className="bg-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Multi-Agent Execution Pipeline Trace</span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                Decision #{analysisResult.decision_id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {analysisResult.execution_trace?.map((step, idx) => (
                <div key={idx} className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-[11px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-200 capitalize">{step.agent.replace('_', ' ')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] text-stone-400 line-clamp-2">{step.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Winner Banner & Why It Won Trigger */}
          <div className="bg-gradient-to-r from-emerald-800 to-[#062c1e] text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-1 border border-emerald-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>Recommended Strategy Selected</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {analysisResult.explanation.winner_name}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                {analysisResult.explanation.why_recommended}
              </p>
              <div className="mt-3">
                <input
                  type="text"
                  value={farmerNotes}
                  onChange={(e) => setFarmerNotes(e.target.value)}
                  placeholder="Optional farmer notes for audit trail (e.g. Will buy 50kg DORB from Mandya APMC)..."
                  className="w-full text-xs px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-600/50 text-white placeholder-emerald-300/60 focus:outline-none focus:border-emerald-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => setShowExplanationModal(true)}
                className="px-4 py-2.5 bg-white text-stone-900 hover:bg-stone-100 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Why Did This Option Win?</span>
              </button>

              <button
                onClick={handleSaveChoice}
                disabled={savingDecision}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to History!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>{savingDecision ? 'Saving...' : 'Select Strategy'}</span>
                  </>
                )}
              </button>

              {onNavigateHistory && (
                <button
                  onClick={onNavigateHistory}
                  className="px-3 py-2 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-bold border border-emerald-700/60 transition"
                >
                  View Audit Trail
                </button>
              )}
            </div>
          </div>

          {/* Candidate Strategies Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                Candidate Strategies Comparison ({analysisResult.candidate_strategies.length})
              </h3>
              <span className="text-xs text-stone-500">Sorted by Multi-Attribute Utility Score</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {analysisResult.candidate_strategies.map((strat, rankIdx) => {
                const isWinner = strat.strategy_id === analysisResult.recommended_strategy_id;
                const isSelected = selectedStrategyId === strat.strategy_id;
                const isExpanded = expandedStrategyId === strat.strategy_id;

                return (
                  <div
                    key={strat.strategy_id}
                    className={`rounded-3xl p-6 border transition-all duration-200 ${
                      isWinner
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                        : strat.eligible
                        ? 'bg-white border-stone-200/90 shadow-xs'
                        : 'bg-stone-50/70 border-stone-200 opacity-80'
                    }`}
                  >
                    {/* Strategy Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold text-stone-400">Rank #{rankIdx + 1}</span>
                          {isWinner && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md border border-emerald-300">
                              RECOMMENDED
                            </span>
                          )}
                          {!strat.eligible && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                              OVER BUDGET
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-stone-900">{strat.name}</h4>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-stone-400 font-medium">Weighted Score</div>
                        <div className="text-xl font-black font-mono text-emerald-800">
                          {strat.scores?.weighted_total || 0}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed mb-4">{strat.description}</p>

                    {/* Financial Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-100 text-center mb-4">
                      <div>
                        <div className="text-[10px] text-stone-400 font-semibold">Daily Cost</div>
                        <div className="text-xs font-bold text-stone-900 font-mono mt-0.5">
                          ₹{strat.estimated_daily_cost_inr.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-semibold">Feasibility</div>
                        <div className="text-xs font-bold text-stone-800 capitalize mt-0.5">
                          {strat.operational_feasibility}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400 font-semibold">Relative Risk</div>
                        <div className={`text-xs font-bold capitalize mt-0.5 ${
                          strat.relative_risk_level === 'high' ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {strat.relative_risk_level}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Button */}
                    <button
                      type="button"
                      onClick={() => setExpandedStrategyId(isExpanded ? null : strat.strategy_id)}
                      className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 font-semibold"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Scoring & Evidence'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="pt-3 mt-3 border-t border-stone-200/80 space-y-3 text-xs">
                        {/* 5-Attribute Scores */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Attribute Score Breakdown (0-100)
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="flex justify-between">
                              <span className="text-stone-500">Affordability:</span>
                              <span className="font-mono font-bold text-stone-800">{strat.scores?.affordability_score}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Animal Welfare:</span>
                              <span className="font-mono font-bold text-stone-800">{strat.scores?.animal_welfare_score}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Financial Impact:</span>
                              <span className="font-mono font-bold text-stone-800">{strat.scores?.financial_impact_score}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Operational Ease:</span>
                              <span className="font-mono font-bold text-stone-800">{strat.scores?.feasibility_score}</span>
                            </div>
                          </div>
                        </div>

                        {/* Evidence & Supporting Points */}
                        {strat.evidence_supporting && strat.evidence_supporting.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                              Supporting Farm Evidence:
                            </div>
                            <ul className="space-y-1 text-stone-600 text-[11px]">
                              {strat.evidence_supporting.map((ev, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Veterinary Flag */}
                        {strat.veterinary_confirmation_required && (
                          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>Veterinary consultation required before adjusting rations for feverish animals.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Radio Select Footer */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedStrategyId(strat.strategy_id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        <span>{isSelected ? 'Chosen Strategy' : 'Select This Strategy'}</span>
                      </button>

                      {onNavigateSimulator && (
                        <button
                          onClick={onNavigateSimulator}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <span>Simulate In What-If</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Initial State */
        <div className="bg-white rounded-3xl p-12 border border-stone-200/90 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200/80">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-stone-900">Ready to Compare Farm Decisions</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Submit the farmer's question above or adjust your priority weights to trigger the multi-agent decision engine.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAnalyze()}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold transition shadow-xs"
          >
            Run Decision Arena on Current Herd
          </button>
        </div>
      )}

      {/* 4. "Why Did This Option Win?" Modal Drawer */}
      {showExplanationModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Decision Agent Explainability
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-2">
                  Why Did "{analysisResult.explanation.winner_name}" Win?
                </h3>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 leading-relaxed">
              <strong>Primary Winning Rationale:</strong> {analysisResult.explanation.why_recommended}
            </div>

            {/* Why Alternatives Ranked Lower */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Why Other Options Ranked Lower:
              </h4>
              <div className="space-y-2">
                {analysisResult.explanation.why_alternatives_ranked_lower?.map((alt, i) => (
                  <div key={i} className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-700">
                    {alt}
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Trade-Offs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Critical Trade-Offs & Sensitivities:
              </h4>
              <div className="space-y-1.5">
                {analysisResult.explanation.critical_tradeoffs?.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
