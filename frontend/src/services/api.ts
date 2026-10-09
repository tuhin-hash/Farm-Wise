import type {
  HealthResponse,
  DashboardData,
  FeedItem,
  AnalyzeDecisionResponse,
  SimulateScenarioResult,
  DecisionHistoryItem
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error (${res.status}): ${errorBody || res.statusText}`);
  }
  return res.json();
}

export const api = {
  getHealth: () => fetchJson<HealthResponse>('/api/health'),

  getDashboard: (farmId: string = 'demo-farm-01') =>
    fetchJson<DashboardData>(`/api/dashboard?farm_id=${encodeURIComponent(farmId)}`),

  getFeeds: async () => {
    const res = await fetchJson<{ total_feeds: number; data_mode: string; feeds: FeedItem[] }>('/api/feeds');
    return res.feeds;
  },

  analyzeDecision: (payload: {
    query: string;
    farm_id?: string;
    budget_inr?: number;
    farmer_strategy?: string;
    priorities?: Record<string, number>;
  }) =>
    fetchJson<AnalyzeDecisionResponse>('/api/decision/analyze', {
      method: 'POST',
      body: JSON.stringify({
        farm_id: 'demo-farm-01',
        budget_inr: 5000,
        ...payload
      })
    }),

  simulateScenario: (payload: {
    feed_a_id: string;
    feed_b_id: string;
    substitution_percentage: number;
    animal_count?: number;
    milk_sale_price_inr?: number;
    daily_milk_production_litres?: number;
    intervention_cost_inr?: number;
    budget_inr?: number;
    current_feed_prices?: Record<string, number>;
  }) =>
    fetchJson<SimulateScenarioResult>('/api/decision/simulate', {
      method: 'POST',
      body: JSON.stringify({
        animal_count: 24,
        milk_sale_price_inr: 38,
        budget_inr: 5000,
        ...payload
      })
    }),

  getDecisions: async () => {
    const res = await fetchJson<{ total_decisions: number; decisions: DecisionHistoryItem[] }>('/api/decisions');
    return res.decisions;
  },

  saveDecisionChoice: (payload: {
    decision_id: string;
    farm_id?: string;
    selected_strategy_id: string;
    farmer_notes?: string;
  }) =>
    fetchJson<{ status: string; message: string; decision_id: string; selected_strategy_id: string }>('/api/decisions', {
      method: 'POST',
      body: JSON.stringify({
        farm_id: 'demo-farm-01',
        ...payload
      })
    }),

  recordOutcome: (decisionId: string, payload: {
    action_taken: string;
    actual_cost_inr?: number;
    observed_milk_change_litres?: number;
    farmer_notes?: string;
    outcome_rating?: number;
  }) =>
    fetchJson<{ decision_id: string; recorded_at: string; message: string; outcome_id: number }>(
      `/api/decisions/${encodeURIComponent(decisionId)}/outcome`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    )
};
