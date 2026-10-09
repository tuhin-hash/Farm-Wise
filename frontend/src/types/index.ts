export interface HealthResponse {
  status: string;
  app_name: string;
  app_version: string;
  data_mode: string;
  llm_enabled: boolean;
  llm_provider: string;
  llm_model: string;
  timestamp: string;
}

export interface BreedBreakdown {
  HF_Cross: number;
  Jersey_Cross: number;
  Gir_Indigenous: number;
}

export interface DailyProduction {
  current_litres: number;
  baseline_litres: number;
  trend_percentage: number;
  current_daily_revenue_inr: number;
  baseline_daily_revenue_inr: number;
}

export interface WaterConsumption {
  current_litres_per_cow: number;
  baseline_litres_per_cow: number;
  trend_percentage: number;
  alert_level: string;
  observation: string;
}

export interface RationItem {
  feed_id: string;
  feed_name: string;
  quantity_kg_per_cow: number;
  unit_price_inr_per_kg: number;
  daily_cost_herd_inr: number;
  price_change_note?: string;
}

export interface CurrentFeedRation {
  ration_name: string;
  total_daily_feed_cost_inr: number;
  cost_per_cow_per_day_inr: number;
  estimated_daily_margin_inr: number;
  margin_assumptions: string;
  items: RationItem[];
}

export interface EnvironmentalConditions {
  ambient_temperature_celsius: number;
  relative_humidity_percentage: number;
  thi_index: number;
  heat_stress_category: string;
  shed_ventilation_type: string;
  recorded_at: string;
  interpretation: string;
}

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  category: string;
  message: string;
}

export interface VitalAssessmentItem {
  name: string;
  observed_value: number;
  unit: string;
  reference_min: number;
  reference_max: number;
  status: string;
  deviation: number;
  clinical_note: string;
}

export interface VeterinaryAssessment {
  animal_tag: string;
  breed: string;
  days_in_milk: number;
  urgency_level: string;
  veterinary_escalation: boolean;
  summary_verdict: string;
  vital_signs_table: VitalAssessmentItem[];
  clinical_synergy: string;
  why_vet_recommended: string;
  key_observations: string[];
  immediate_actions: string[];
  reference_citation: string;
}

export interface AttentionAnimal {
  animal_tag: string;
  breed: string;
  days_in_milk: number;
  rectal_temperature_celsius: number;
  respiration_rate_bpm: number;
  heart_rate_bpm?: number;
  appetite_observation: string;
  suspected_issue: string;
  action_required: string;
  veterinary_escalation: boolean;
  veterinary_assessment?: VeterinaryAssessment;
}

export interface ProductionHistoryPoint {
  day: number;
  date: string;
  milk_litres: number;
  avg_temp_c: number;
  water_litres_per_cow: number;
}

export interface DashboardData {
  farm_id: string;
  farm_name: string;
  location: string;
  data_mode: string;
  provenance_note: string;
  animal_count: number;
  breeds: Record<string, number>;
  milk_sale_price_inr_per_litre: number;
  daily_production: DailyProduction;
  water_consumption: WaterConsumption;
  current_feed_ration: CurrentFeedRation;
  environmental_conditions: EnvironmentalConditions;
  active_alerts: AlertItem[];
  animals_requiring_attention: AttentionAnimal[];
  production_history_14d: ProductionHistoryPoint[];
}

export interface FeedItem {
  feed_id: string;
  name: string;
  category: string;
  unit_price_inr_per_kg: number;
  baseline_price_inr_per_kg?: number;
  dry_matter_pct: number;
  crude_protein_pct: number;
  energy_tdn_pct: number;
  energy_me_mj_per_kg?: number;
  calcium_pct?: number;
  phosphorus_pct?: number;
  availability: string;
  provenance: string;
  notes?: string;
}

export interface ScoringBreakdown {
  affordability_score: number;
  animal_welfare_score: number;
  financial_impact_score: number;
  risk_score: number;
  feasibility_score: number;
  weighted_total: number;
  weights_applied: Record<string, number>;
  scoring_formula: string;
}

export interface CandidateStrategy {
  strategy_id: string;
  name: string;
  description: string;
  estimated_daily_cost_inr: number;
  estimated_daily_revenue_inr?: number;
  estimated_daily_margin_inr?: number;
  relative_risk_level: 'low' | 'medium' | 'high';
  operational_feasibility: 'easy' | 'moderate' | 'challenging';
  expected_impact: string;
  advantages: string[];
  drawbacks: string[];
  evidence_supporting: string[];
  assumptions: string[];
  missing_information: string[];
  veterinary_confirmation_required: boolean;
  veterinary_confirmation_details?: string;
  eligible: boolean;
  ineligibility_reason?: string;
  scores: ScoringBreakdown;
}

export interface ExecutionTraceStep {
  agent: string;
  status: string;
  summary: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface RecommendationExplanation {
  winner_name: string;
  why_recommended: string;
  why_alternatives_ranked_lower: string[];
  critical_tradeoffs: string[];
  sensitivity_to_priorities: string;
}

export interface AnalyzeDecisionResponse {
  decision_id: string;
  farm_id: string;
  data_mode: string;
  query: string;
  analysis_summary: string;
  selected_agents: string[];
  execution_trace: ExecutionTraceStep[];
  evidence: Record<string, any>;
  candidate_strategies: CandidateStrategy[];
  recommended_strategy_id: string;
  explanation: RecommendationExplanation;
  assumptions: string[];
  missing_data: string[];
  safety_notes: string[];
  created_at: string;
}

export interface SimulateScenarioResult {
  feed_a: Record<string, any>;
  feed_b: Record<string, any>;
  substitution_percentage: number;
  animal_count: number;
  current_scenario: {
    feed_cost_inr: number;
    intervention_cost_inr: number;
    total_cost_inr: number;
    daily_milk_litres: number;
    daily_revenue_inr: number;
    daily_margin_inr: number;
    concentrate_unit_price_inr_per_kg?: number;
  };
  alternative_scenario: {
    feed_cost_inr: number;
    intervention_cost_inr: number;
    total_cost_inr: number;
    daily_milk_litres: number;
    daily_revenue_inr: number;
    daily_margin_inr: number;
    blended_concentrate_price_inr_per_kg?: number;
    blended_crude_protein_pct?: number;
    blended_energy_tdn_pct?: number;
  };
  cost_difference_daily_inr: number;
  margin_difference_daily_inr: number;
  nutritional_tradeoffs: {
    baseline_feed_name?: string;
    alternative_feed_name?: string;
    price_difference_inr_per_kg?: number;
    price_percentage_change?: number;
    crude_protein_delta_pct?: number;
    energy_tdn_delta_pct?: number;
    tradeoff_summary?: string[];
  };
  risk_notes: string[];
  assumptions_and_limitations: string[];
  eligible_under_budget: boolean;
  budget_inr: number;
  data_mode: string;
}

export interface DecisionOutcome {
  id: number;
  recorded_at: string;
  action_taken: string;
  actual_cost_inr?: number;
  observed_milk_change_litres?: number;
  farmer_notes?: string;
  outcome_rating?: number;
}

export interface DecisionHistoryItem {
  decision_id: string;
  farm_id: string;
  created_at: string;
  query: string;
  farmer_strategy?: string;
  budget_inr?: number;
  recommended_strategy_id?: string;
  selected_by_farmer_strategy_id?: string;
  farmer_notes?: string;
  status: string;
  candidate_strategies?: CandidateStrategy[];
  outcomes?: DecisionOutcome[];
}

export type BlobState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'SUCCESS' | 'ERROR' | 'STOPPED';

export interface NotificationItem {
  id: string;
  farm_id: string;
  title: string;
  title_kn?: string;
  message: string;
  message_kn?: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  category: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface NotificationSettings {
  farm_id: string;
  phone_number: string;
  country_code: string;
  sms_enabled: boolean;
  preferred_language: string;
  notify_milk_drop: boolean;
  notify_heat_stress: boolean;
  notify_vet_triage: boolean;
  notify_decision_review: boolean;
  last_updated?: string;
}

export interface SMSLogItem {
  id: number;
  phone_number: string;
  message_text: string;
  language: string;
  status: string;
  provider: string;
  created_at: string;
  error_message?: string;
  notification_id?: string;
}

export interface VoiceQueryResponse {
  query: string;
  language: string;
  response_en: string;
  response_kn: string;
  detected_intent?: string;
  recommended_tab?: string;
  active_agents: string[];
  evidence_summary: Record<string, any>;
  safety_warning?: string;
  is_vet_triage: boolean;
  suggested_followups: string[];
  action?: {
    type: 'NAVIGATE' | 'OPEN_NOTIFICATIONS';
    tab?: string;
    target_cow?: string;
    label?: string;
  };
  card?: {
    type: 'cow_vital' | 'decision_arena' | 'simulator_preview' | 'heat_stress' | 'sms_dispatch';
    title: string;
    [key: string]: any;
  };
}

export interface VoiceTranscribeResponse {
  status: string;
  transcript: string;
  language?: string;
  confidence?: number;
  model: string;
}

export interface CowSummary {
  animal_tag: string;
  breed: string;
  category: string;
  days_in_milk: number;
  parity: number;
  calving_date: string;
  current_daily_yield_litres: number;
  baseline_daily_yield_litres: number;
  heart_rate_bpm: number;
  rectal_temperature_celsius: number;
  respiration_rate_bpm: number;
  rumen_contractions_per_2min: number;
  rumen_fill_score: number;
  locomotion_score: number;
  california_mastitis_risk: string;
  appetite_observation: string;
  suspected_issue: string;
  urgency_level: string;
  veterinary_escalation: boolean;
  health_status: 'CRITICAL' | 'WARNING' | 'OBSERVATION' | 'HEALTHY';
  daily_concentrate_kg?: number;
  water_intake_estimate_litres?: number;
  veterinary_assessment?: VeterinaryAssessment;
}

export interface CowDossier {
  farm_id: string;
  farm_name: string;
  location: string;
  generated_at: string;
  cow: CowSummary;
  reference_standard: string;
  vital_ranges: Record<string, { min: number; max: number; unit: string; description: string }>;
  environmental_thi: number;
  production_history_14d: {
    day: number;
    date: string;
    milk_litres: number;
    baseline_litres: number;
    thi: number;
    status: string;
    notes: string;
  }[];
  individual_ration: {
    concentrate_kg: number;
    green_fodder_kg: number;
    dry_fodder_kg: number;
    mineral_mixture_grams: number;
    clean_water_requirement_litres: number;
    notes: string;
  };
  immediate_farm_actions: string[];
  responsible_ai_disclaimer: string;
}

