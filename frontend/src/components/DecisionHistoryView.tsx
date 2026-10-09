import React, { useState, useEffect } from 'react';
import type { DecisionHistoryItem, DecisionOutcome } from '../types';
import { api } from '../services/api';
import {
  History,
  Award,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Star,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const DecisionHistoryView: React.FC = () => {
  const [decisions, setDecisions] = useState<DecisionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Record outcome modal state
  const [selectedDecisionForOutcome, setSelectedDecisionForOutcome] = useState<DecisionHistoryItem | null>(null);
  const [actionTaken, setActionTaken] = useState<string>('');
  const [actualCost, setActualCost] = useState<number>(0);
  const [observedMilkChange, setObservedMilkChange] = useState<number>(0);
  const [farmerNotes, setFarmerNotes] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState<boolean>(false);
  const [outcomeSuccessMessage, setOutcomeSuccessMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await api.getDecisions();
      setDecisions(items);
      if (items.length > 0 && !expandedId) {
        setExpandedId(items[0].decision_id);
      }
    } catch (err: any) {
      console.error('Failed to load decision history:', err);
      setError(err.message || 'Failed to load past decisions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenOutcomeModal = (decision: DecisionHistoryItem) => {
    setSelectedDecisionForOutcome(decision);
    setActionTaken(decision.selected_by_farmer_strategy_id || decision.recommended_strategy_id || '');
    setActualCost(decision.budget_inr || 4700);
    setObservedMilkChange(18.5);
    setFarmerNotes('Implemented electrolyte trough and installed mesh shade over loafing area. Production stabilized.');
    setRating(5);
    setOutcomeSuccessMessage(null);
  };

  const handleSubmitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDecisionForOutcome) return;

    setIsSubmittingOutcome(true);
    try {
      await api.recordOutcome(selectedDecisionForOutcome.decision_id, {
        action_taken: actionTaken,
        actual_cost_inr: actualCost,
        observed_milk_change_litres: observedMilkChange,
        farmer_notes: farmerNotes,
        outcome_rating: rating
      });
      setOutcomeSuccessMessage('Outcome recorded successfully! FarmWise audit log updated.');
      setTimeout(() => {
        setSelectedDecisionForOutcome(null);
        setOutcomeSuccessMessage(null);
        fetchHistory();
      }, 1200);
    } catch (err: any) {
      alert(`Error recording outcome: ${err.message}`);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Decision Audit Trail & Longitudinal Outcomes</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Review past multi-agent comparative evaluations, farmer overrides, and actual operational ground results.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Decisions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-stone-500">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mb-2" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200/90 shadow-xs text-center space-y-3">
          <History className="w-12 h-12 mx-auto text-stone-300" />
          <h3 className="text-base font-bold text-stone-900">No decisions recorded yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Run an analysis in the Decision Arena to generate strategies, select your preferred path, and log it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((item) => {
            const isExpanded = expandedId === item.decision_id;
            const hasOutcomes = item.outcomes && item.outcomes.length > 0;

            return (
              <div
                key={item.decision_id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  onClick={() => setExpandedId(isExpanded ? null : item.decision_id)}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {item.decision_id}
                      </span>
                      <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono font-semibold">
                        Budget: ₹{item.budget_inr?.toLocaleString() || 'N/A'}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-stone-900 line-clamp-1">
                      "{item.query}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-stone-400 font-medium">Recommended:</div>
                      <div className="text-xs font-bold text-emerald-800">
                        {item.recommended_strategy_id || 'Pending'}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOutcomeModal(item);
                      }}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record Outcome</span>
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-stone-100 p-6 bg-stone-50/60 space-y-5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-stone-200/80">
                        <div className="text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                          Farmer's Problem / Traditional Approach:
                        </div>
                        <p className="text-stone-800 font-medium">{item.farmer_strategy || 'No traditional strategy specified'}</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-stone-200/80">
                        <div className="text-stone-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                          Selected Strategy Status:
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span className="text-stone-900 font-bold">
                            {item.selected_by_farmer_strategy_id
                              ? `Selected by Farmer: ${item.selected_by_farmer_strategy_id}`
                              : `System Recommended: ${item.recommended_strategy_id || 'Awaiting selection'}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Strategies Evaluated */}
                    {item.candidate_strategies && item.candidate_strategies.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                          Candidate Strategies Evaluated in Arena:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {item.candidate_strategies.map((strat) => (
                            <div
                              key={strat.strategy_id}
                              className={`p-4 rounded-2xl border ${
                                strat.strategy_id === item.recommended_strategy_id
                                  ? 'bg-emerald-50/70 border-emerald-300'
                                  : 'bg-white border-stone-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-stone-900">{strat.name}</span>
                                {strat.strategy_id === item.recommended_strategy_id && (
                                  <Award className="w-4 h-4 text-emerald-700" />
                                )}
                              </div>
                              <p className="text-stone-500 line-clamp-2 mb-2 text-[11px]">{strat.description}</p>
                              <div className="flex justify-between items-center text-[11px] pt-2 border-t border-stone-100 font-semibold">
                                <span className="font-mono text-emerald-800">₹{strat.estimated_daily_cost_inr}/day</span>
                                <span className="text-stone-600">Score: {strat.scores?.weighted_total || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recorded Longitudinal Outcomes */}
                    <div>
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Recorded Ground Reality Outcomes:
                      </div>
                      {hasOutcomes ? (
                        <div className="space-y-2">
                          {item.outcomes!.map((outcome: DecisionOutcome) => (
                            <div
                              key={outcome.id}
                              className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-emerald-800">{outcome.action_taken}</span>
                                  <span className="text-[10px] text-stone-400 font-medium">
                                    {new Date(outcome.recorded_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-stone-600 italic">"{outcome.farmer_notes}"</p>
                              </div>

                              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                                <div className="text-stone-600">Actual Cost: <strong>₹{outcome.actual_cost_inr ?? 'N/A'}</strong></div>
                                <div className="text-emerald-700 font-bold">
                                  Yield Delta: +{outcome.observed_milk_change_litres ?? 0} L/day
                                </div>
                                <div className="flex items-center text-amber-600 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                                  {outcome.outcome_rating || 5}/5
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-stone-400 italic text-[11px]">
                          No field outcomes recorded yet. Use "Record Outcome" above to document true ground results.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Outcome Modal */}
      {selectedDecisionForOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Ground Reality Tracking
              </span>
              <h3 className="text-xl font-black text-stone-900 mt-2">
                Record Operational Outcome
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Decision #{selectedDecisionForOutcome.decision_id}
              </p>
            </div>

            {outcomeSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm text-center flex items-center justify-center gap-2 my-6 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{outcomeSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitOutcome} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-800 font-bold mb-1">Action Implemented on Farm</label>
                  <input
                    type="text"
                    required
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="e.g. Deployed 25% DORB blend + shaded water troughs"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-800 font-bold mb-1">Actual Total Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={actualCost}
                      onChange={(e) => setActualCost(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-800 font-bold mb-1">Observed Milk Change (L/day)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={observedMilkChange}
                      onChange={(e) => setObservedMilkChange(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-800 font-bold mb-1">Farmer Experience & Field Observations</label>
                  <textarea
                    rows={3}
                    value={farmerNotes}
                    onChange={(e) => setFarmerNotes(e.target.value)}
                    placeholder="Did cows consume the feed blend eagerly? Did water intake normalize?"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-800 font-bold mb-1">Overall Outcome Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-2 rounded-xl border text-sm font-bold flex items-center gap-1 ${
                          rating >= star
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-stone-50 border-stone-200 text-stone-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${rating >= star ? 'fill-amber-500 text-amber-500' : ''}`} />
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setSelectedDecisionForOutcome(null)}
                    disabled={isSubmittingOutcome}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOutcome}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                  >
                    {isSubmittingOutcome ? 'Saving...' : 'Save Field Outcome'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
