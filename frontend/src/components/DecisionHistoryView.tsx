import React, { useState, useEffect } from 'react';
import type { DecisionHistoryItem, DecisionOutcome } from '../types';
import { api } from '../services/api';
import { History, Award, CheckCircle2, Clock, ChevronDown, ChevronUp, PlusCircle, Star, AlertCircle, RefreshCw } from 'lucide-react';

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
    setActualCost(decision.budget_inr || 3500);
    setObservedMilkChange(15);
    setFarmerNotes('Implemented electrolyte trough and installed mesh shade over loafing area.');
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
      }, 1500);
    } catch (err: any) {
      alert(`Error recording outcome: ${err.message}`);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Decision Audit Trail & Longitudinal Outcomes</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              SQLite Persistent Storage
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review past multi-agent comparative evaluations, farmer overrides, and actual operational outcomes
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Decisions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No decisions recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition"
              >
                <div
                  className="p-5 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  onClick={() => setExpandedId(isExpanded ? null : item.decision_id)}
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        {item.decision_id}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        Budget: ₹{item.budget_inr?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 mt-1 line-clamp-1">
                      "{item.query}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400">Recommended:</div>
                      <div className="text-xs font-semibold text-emerald-400">
                        {item.recommended_strategy_id || 'Pending'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOutcomeModal(item);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Record Outcome
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-5 bg-slate-950/50 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                        <div className="text-slate-400 font-semibold mb-1">Farmer's Stated Problem / Traditional Practice:</div>
                        <p className="text-slate-300">{item.farmer_strategy || 'No traditional strategy specified'}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                        <div className="text-slate-400 font-semibold mb-1">Status & Selected Strategy:</div>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-200 font-medium">
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
                        <div className="text-slate-400 font-semibold mb-2">Evaluated Strategies in Arena:</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {item.candidate_strategies.map((strat) => (
                            <div
                              key={strat.strategy_id}
                              className={`p-3 rounded-xl border ${
                                strat.strategy_id === item.recommended_strategy_id
                                  ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 font-semibold text-slate-100">
                                <span>{strat.name}</span>
                                {strat.strategy_id === item.recommended_strategy_id && (
                                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                              <div className="text-slate-400 line-clamp-2 mb-2">{strat.description}</div>
                              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                                <span className="font-mono text-emerald-400">₹{strat.estimated_daily_cost_inr}/day</span>
                                <span className="font-semibold text-slate-400">Score: {strat.scores?.weighted_total || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recorded Longitudinal Outcomes */}
                    <div>
                      <div className="text-slate-400 font-semibold mb-2">Actual Ground Outcomes Recorded:</div>
                      {hasOutcomes ? (
                        <div className="space-y-2">
                          {item.outcomes!.map((outcome: DecisionOutcome) => (
                            <div
                              key={outcome.id}
                              className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-emerald-300">{outcome.action_taken}</span>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(outcome.recorded_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-slate-400 italic">"{outcome.farmer_notes}"</p>
                              </div>
                              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                                <div>Actual Cost: ₹{outcome.actual_cost_inr ?? 'N/A'}</div>
                                <div className="text-emerald-400 font-bold">
                                  Yield Delta: +{outcome.observed_milk_change_litres ?? 0} L/day
                                </div>
                                <div className="flex items-center text-amber-400 font-bold">
                                  <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                                  {outcome.outcome_rating || 5}/5
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">
                          No outcomes recorded yet. Use "Record Outcome" above once the intervention has been implemented.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              Record Longitudinal Outcome
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Decision #{selectedDecisionForOutcome.decision_id} — Ground reality tracking
            </p>

            {outcomeSuccessMessage ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-sm text-center flex items-center justify-center gap-2 my-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{outcomeSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitOutcome} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Action Implemented</label>
                  <input
                    type="text"
                    required
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="e.g. Swapped to Cottonseed Cake + Shade Cloths"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Actual Total Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={actualCost}
                      onChange={(e) => setActualCost(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Observed Milk Change (L/day)</label>
                    <input
                      type="number"
                      required
                      value={observedMilkChange}
                      onChange={(e) => setObservedMilkChange(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Farmer Notes & Experience</label>
                  <textarea
                    rows={3}
                    value={farmerNotes}
                    onChange={(e) => setFarmerNotes(e.target.value)}
                    placeholder="Did cows consume the feed? Did respiration calm down?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Overall Outcome Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-2 rounded-lg border text-sm font-bold flex items-center gap-1 ${
                          rating >= star
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${rating >= star ? 'fill-amber-400 text-amber-400' : ''}`} />
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedDecisionForOutcome(null)}
                    disabled={isSubmittingOutcome}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOutcome}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold flex items-center gap-2"
                  >
                    {isSubmittingOutcome ? 'Saving...' : 'Save Outcome'}
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
