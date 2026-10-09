import React from 'react';
import {
  TrendingDown,
  Droplets,
  Thermometer,
  AlertTriangle,
  IndianRupee,
  Layers,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import type { DashboardData } from '../types';

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
  onNavigateSimulator: _onNavigateSimulator,
  onRefresh: _onRefresh,
  isLoading: _isLoading
}) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p>Loading farm dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Farm Overview Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{data.farm_name}</h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {data.data_mode === 'synthetic_demo' ? 'Synthetic Demo Herd' : 'Live Herd'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            📍 {data.location} • 🐄 {data.animal_count} Dairy Cows (HF Cross: {data.breeds.HF_Cross}, Jersey Cross: {data.breeds.Jersey_Cross}, Gir: {data.breeds.Gir_Indigenous})
          </p>
          <p className="text-xs text-slate-400 mt-1 italic">
            "{data.provenance_note}"
          </p>
        </div>

        <button
          onClick={onNavigateToArena}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-sm shadow-md hover:from-emerald-700 hover:to-green-700 transition"
        >
          <span>Open Decision Arena</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Primary Financial & Yield Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milk Production */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milk Production</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{data.daily_production.current_litres}</span>
            <span className="text-sm font-semibold text-slate-500">L / day</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
            <span>{data.daily_production.trend_percentage}% drop</span>
            <span className="text-slate-400 font-normal">from {data.daily_production.baseline_litres}L baseline</span>
          </div>
        </div>

        {/* Daily Milk Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Milk Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              ₹{data.daily_production.current_daily_revenue_inr.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            At ₹{data.milk_sale_price_inr_per_litre.toFixed(2)}/L (was ₹{data.daily_production.baseline_daily_revenue_inr.toLocaleString()})
          </div>
        </div>

        {/* Daily Feed Bill */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Feed Cost</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              ₹{data.current_feed_ration.total_daily_feed_cost_inr.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            ₹{data.current_feed_ration.cost_per_cow_per_day_inr.toFixed(1)}/cow/day (+18% concentrate hike)
          </div>
        </div>

        {/* Operating Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Margin</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              ₹{data.current_feed_ration.estimated_daily_margin_inr.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">/ day</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate" title={data.current_feed_ration.margin_assumptions}>
            {data.current_feed_ration.margin_assumptions}
          </div>
        </div>
      </div>

      {/* Environmental & Water Tension Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environmental Heat Stress Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Thermal Stress Monitoring</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-600 text-white rounded-full">
              {data.environmental_conditions.heat_stress_category}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
              <div className="text-xs text-slate-500">Ambient Temp</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{data.environmental_conditions.ambient_temperature_celsius}°C</div>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
              <div className="text-xs text-slate-500">Relative Humidity</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{data.environmental_conditions.relative_humidity_percentage}%</div>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
              <div className="text-xs text-slate-500">Calculated THI</div>
              <div className="text-xl font-bold text-amber-600 mt-1">{data.environmental_conditions.thi_index}</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            {data.environmental_conditions.interpretation}
          </p>
        </div>

        {/* Water Consumption Paradox Card */}
        <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-slate-50 rounded-2xl p-6 border border-cyan-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-bold text-slate-900">Water Intake Paradox</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-cyan-600 text-white rounded-full">
              {data.water_consumption.alert_level}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/80 p-3 rounded-xl border border-cyan-100">
              <div className="text-xs text-slate-500">Current Intake</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{data.water_consumption.current_litres_per_cow} <span className="text-xs font-normal text-slate-500">L / cow</span></div>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-cyan-100">
              <div className="text-xs text-slate-500">Summer Need (35°C)</div>
              <div className="text-2xl font-bold text-cyan-700 mt-1">95 - 110 <span className="text-xs font-normal text-slate-500">L / cow</span></div>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            {data.water_consumption.observation}
          </p>
        </div>
      </div>

      {/* Active Alerts & Flagged Animals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Active Herd Alerts</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{data.active_alerts.length} total</span>
          </div>

          <div className="space-y-3">
            {data.active_alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.severity === 'HIGH'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider shrink-0 mt-0.5 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : alert.severity === 'HIGH'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-300 text-slate-800'
                }`}>
                  {alert.severity}
                </span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Individual Animals */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">Animals Requiring Clinical Attention</h2>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Vet Review Required
            </span>
          </div>

          <div className="space-y-4">
            {data.animals_requiring_attention.map((animal) => (
              <div key={animal.animal_tag} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{animal.animal_tag}</span>
                  <span className="text-xs text-slate-500">{animal.breed} • {animal.days_in_milk} DIM</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-600">
                    <span className="font-medium text-slate-800">Rectal Temp:</span> {animal.rectal_temperature_celsius}°C
                  </div>
                  <div className="text-slate-600">
                    <span className="font-medium text-slate-800">Respiration:</span> {animal.respiration_rate_bpm} bpm
                  </div>
                </div>
                <div className="text-xs text-rose-800 font-medium">
                  Issue: {animal.suspected_issue}
                </div>
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-rose-100">
                  <span className="font-semibold text-rose-700">Action:</span> {animal.action_required}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
