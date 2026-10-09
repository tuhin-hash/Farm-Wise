import React, { useState } from 'react';
import {
  TrendingDown,
  Droplets,
  Thermometer,
  AlertTriangle,
  IndianRupee,
  Layers,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Compass,
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';
import type { DashboardData } from '../types';
import { Farm3DView } from './Farm3DView';

export interface DashboardViewProps {
  data: DashboardData | null;
  onNavigateToArena?: () => void;
  onNavigateSimulator?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigateToArena,
  onNavigateSimulator,
  onRefresh: _onRefresh,
  isLoading: _isLoading
}) => {
  const [show3DFarm, setShow3DFarm] = useState(true);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-stone-700">Loading Sri Lakshmi Dairy Farm Telemetry...</p>
        <span className="text-xs text-stone-400 mt-1">Fetching live SQLite herd records</span>
      </div>
    );
  }

  const {
    farm_name,
    location,
    animal_count,
    breeds,
    daily_production,
    water_consumption,
    current_feed_ration,
    environmental_conditions,
    animals_requiring_attention,
    production_history_14d
  } = data;

  const maxMilk = Math.max(...(production_history_14d || []).map((h) => h.milk_litres), 480);
  const minMilk = Math.min(...(production_history_14d || []).map((h) => h.milk_litres), 390);

  return (
    <div className="space-y-8">
      {/* 1. Farm Header Banner & Synthetic Data Badge */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">{farm_name}</h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full border border-emerald-200">
              Demo Dairy Farm (Karnataka)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            📍 {location} • 🐄 {animal_count} Crossbred Cows (HF Cross: {breeds.HF_Cross}, Jersey Cross: {breeds.Jersey_Cross}, Gir: {breeds.Gir_Indigenous})
          </p>
          <p className="text-[11px] text-stone-400 italic">
            Synthetic benchmark dataset representing an intensive smallholder dairy operation under heat stress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShow3DFarm(!show3DFarm)}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-200"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>{show3DFarm ? 'Hide 3D Digital Twin' : 'Show 3D Digital Twin'}</span>
          </button>

          {onNavigateToArena && (
            <button
              onClick={onNavigateToArena}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze in Arena</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Embedded 3D Farm Digital Twin (Toggleable) */}
      {show3DFarm && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Interactive 3D Digital Twin Viewport</span>
            </div>
            <span className="text-xs text-stone-400">Click structures for sensor telemetry</span>
          </div>
          <Farm3DView onNavigate={() => onNavigateToArena && onNavigateToArena()} compact={true} />
        </div>
      )}

      {/* 3. Four Core SaaS KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Daily Milk Production */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Milk Production</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {daily_production.current_litres} <span className="text-base font-normal text-stone-500">L / day</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-rose-600">
                {daily_production.trend_percentage}% vs baseline
              </span>
              <span className="text-xs text-stone-400">({daily_production.baseline_litres} L baseline)</span>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
            3-day persistent decline under THI thermal load
          </div>
        </div>

        {/* KPI 2: Daily Milk Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Daily Milk Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              ₹{daily_production.current_daily_revenue_inr.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-stone-600">
                Benchmark: ₹38.00 / Litre
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 text-[11px] text-rose-600 font-semibold">
            -₹{(daily_production.baseline_daily_revenue_inr - daily_production.current_daily_revenue_inr).toLocaleString()}/day revenue shortfall
          </div>
        </div>

        {/* KPI 3: Daily Herd Feed Cost */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Daily Feed Cost</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              ₹{current_feed_ration.total_daily_feed_cost_inr.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-stone-600">
                ₹{current_feed_ration.cost_per_cow_per_day_inr.toFixed(2)} / cow / day
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 text-[11px] text-amber-700 font-semibold">
            Concentrate prices rose to ₹28.00/kg (+12%)
          </div>
        </div>

        {/* KPI 4: Operating Margin */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Operating Margin</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              ₹{current_feed_ration.estimated_daily_margin_inr.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-semibold text-stone-600">
                ₹{(current_feed_ration.estimated_daily_margin_inr / animal_count).toFixed(2)} / cow / day
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
            Revenue minus daily feed & ration expenditure
          </div>
        </div>
      </div>

      {/* 4. Thermal Stress (THI) & Water Intake Monitoring Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental & Heat Stress Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200/80">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Thermal Stress & THI Load</h3>
                <p className="text-xs text-stone-500">Temperature-Humidity Index in dairy barn</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full border border-amber-300">
              {environmental_conditions.heat_stress_category.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Gauge / Value Bar */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-amber-700">{environmental_conditions.thi_index}</span>
                <span className="text-xs font-bold text-stone-500 ml-1.5">THI Index</span>
              </div>
              <div className="text-right text-xs text-stone-600">
                <div>Ambient: <strong>{environmental_conditions.ambient_temperature_celsius}°C</strong></div>
                <div>Relative Humidity: <strong>{environmental_conditions.relative_humidity_percentage}%</strong></div>
              </div>
            </div>

            {/* THI Spectrum Progress Bar */}
            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 rounded-full"
                style={{ width: `${Math.min((environmental_conditions.thi_index / 100) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 font-semibold">
              <span>Comfortable (&lt; 72)</span>
              <span>Mild (72-79)</span>
              <span className="text-amber-700 font-bold">Moderate (80-89)</span>
              <span>Severe (&gt; 90)</span>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            {environmental_conditions.interpretation}
          </p>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Vulnerability:</strong> HF crossbred cows produce 20% more metabolic heat than indigenous cows and show the sharpest drop in dry matter intake.
            </span>
          </div>
        </div>

        {/* Water Intake & Hydration Monitoring */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-2xl border border-cyan-200/80">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Hydration & Water Intake</h3>
                <p className="text-xs text-stone-500">Daily water intake per lactating cow</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-black rounded-full border border-cyan-300">
              {water_consumption.alert_level}
            </span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-cyan-700">{water_consumption.current_litres_per_cow}</span>
                <span className="text-xs font-bold text-stone-500 ml-1.5">L / cow / day</span>
              </div>
              <div className="text-right text-xs">
                <span className="text-cyan-700 font-bold font-mono">+{water_consumption.trend_percentage}%</span>
                <span className="text-stone-400 block">vs {water_consumption.baseline_litres_per_cow} L baseline</span>
              </div>
            </div>

            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${Math.min((water_consumption.current_litres_per_cow / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            {water_consumption.observation}
          </p>

          <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-200/60 text-xs text-cyan-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-cyan-600" />
            <span>
              <strong>Actionable Protocol:</strong> Shading drinking troughs lowers trough water temperatures by 3-5°C, encouraging proper rumen hydration and electrolyte balance.
            </span>
          </div>
        </div>
      </div>

      {/* 5. Feed Ration & 14-Day Production Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Feed Ration Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Current Daily Ration</h3>
            {onNavigateSimulator && (
              <button
                onClick={onNavigateSimulator}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Simulate</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {current_feed_ration.items.map((item) => (
              <div key={item.feed_id} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-800">{item.feed_name}</span>
                  <span className="font-mono font-bold text-stone-900">₹{item.daily_cost_herd_inr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-stone-500">
                  <span>{item.quantity_kg_per_cow} kg / cow</span>
                  <span>₹{item.unit_price_inr_per_kg}/kg</span>
                </div>
                {item.price_change_note && (
                  <div className="text-[10px] text-amber-700 font-medium pt-1">
                    ⚠️ {item.price_change_note}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 text-xs flex justify-between items-center font-bold text-emerald-900">
            <span>Total Herd Feed Cost:</span>
            <span className="font-mono text-sm">₹{current_feed_ration.total_daily_feed_cost_inr.toLocaleString()}/day</span>
          </div>
        </div>

        {/* 14-Day Milk Production History Spark-Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">14-Day Milk Yield Rolling History</h3>
              <p className="text-xs text-stone-500">Daily herd volume in litres (Mandya 24-cow cohort)</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>March 2026</span>
            </div>
          </div>

          {/* Simple Clean Bar Chart */}
          <div className="h-44 w-full flex items-end justify-between gap-1.5 pt-4 pb-2">
            {(production_history_14d || []).map((pt, idx) => {
              const heightPct = ((pt.milk_litres - minMilk) / (maxMilk - minMilk || 1)) * 80 + 15;
              const isLatest = idx === (production_history_14d?.length || 0) - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-stone-900 text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    Day {pt.day}: {pt.milk_litres} L
                  </div>
                  {isLatest && (
                    <span className="text-[10px] font-bold text-emerald-700 mb-1">
                      {pt.milk_litres}L
                    </span>
                  )}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[24px] rounded-t-lg transition-all duration-300 ${
                      isLatest
                        ? 'bg-emerald-600'
                        : pt.milk_litres < 420
                        ? 'bg-rose-400/80 group-hover:bg-rose-500'
                        : 'bg-emerald-400/80 group-hover:bg-emerald-500'
                    }`}
                  />
                  <span className="text-[10px] text-stone-400 mt-1">D{pt.day}</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-600 flex items-center justify-between">
            <span>Correlation Analysis: <strong>Heat Wave on Day 11 directly caused a 35 L drop in production.</strong></span>
            {onNavigateToArena && (
              <button
                onClick={onNavigateToArena}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 shrink-0 ml-2"
              >
                Find Solution &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Active Herd Attention Animals Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>High-Risk / Individual Observation Animals ({animals_requiring_attention?.length || 0})</span>
            </h3>
            <p className="text-xs text-stone-500">Animals showing physiological vitals outside reference ranges</p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Clinical Triage Protocol
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3">Tag</th>
                <th className="pb-3">Breed</th>
                <th className="pb-3">Rectal Temp</th>
                <th className="pb-3">Respiration Rate</th>
                <th className="pb-3">Observation</th>
                <th className="pb-3">Required Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(animals_requiring_attention || []).map((animal) => (
                <tr key={animal.animal_tag} className="hover:bg-stone-50/60 transition">
                  <td className="py-3 font-mono font-bold text-stone-900">{animal.animal_tag}</td>
                  <td className="py-3 font-medium">{animal.breed}</td>
                  <td className="py-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        animal.rectal_temperature_celsius >= 39.5
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {animal.rectal_temperature_celsius}°C
                    </span>
                  </td>
                  <td className="py-3 font-mono">{animal.respiration_rate_bpm} bpm</td>
                  <td className="py-3 text-stone-600">{animal.suspected_issue}</td>
                  <td className="py-3">
                    {animal.veterinary_escalation ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Refer to Veterinarian</span>
                      </span>
                    ) : (
                      <span className="text-stone-500">{animal.action_required}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
