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
  Activity,
  Stethoscope,
  Heart,
  Info
} from 'lucide-react';
import type { DashboardData, AttentionAnimal } from '../types';
import { Farm3DView } from './Farm3DView';
import { VeterinaryAlertModal } from './VeterinaryAlertModal';

export interface DashboardViewProps {
  data: DashboardData | null;
  onNavigateToArena?: () => void;
  onNavigateSimulator?: () => void;
  onNavigateToCowReport?: (tag: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigateToArena,
  onNavigateSimulator,
  onNavigateToCowReport,
  onRefresh: _onRefresh,
  isLoading: _isLoading
}) => {
  const [show3DFarm, setShow3DFarm] = useState(true);
  const [selectedVetAnimal, setSelectedVetAnimal] = useState<AttentionAnimal | null>(null);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-stone-700">Loading NammaHerd Dairy Telemetry...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">14-Day Milk Yield Rolling History</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Day 11 Drop: -35 L
                </span>
              </div>
              <p className="text-xs text-stone-500">Daily herd volume in litres (Mandya 24-cow cohort • Baseline: 445 L)</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>May 2026 Mandya Records</span>
            </div>
          </div>

          {/* Chart with Baseline and Day 11 Drop Annotation */}
          <div className="relative pt-6 pb-2">
            {/* 445 L Baseline Reference Line */}
            <div
              className="absolute left-8 right-0 border-t border-dashed border-emerald-400/80 z-0 flex items-center justify-end pr-1 pointer-events-none"
              style={{
                bottom: `${Math.min(Math.max(((445 - minMilk) / (maxMilk - minMilk || 1)) * 140 + 24, 20), 190)}px`
              }}
            >
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
                445 L Baseline
              </span>
            </div>

            <div className="h-48 w-full flex items-end justify-between gap-1.5 pl-6">
              {(production_history_14d || []).map((pt, idx) => {
                const heightPct = Math.max(((pt.milk_litres - minMilk) / (maxMilk - minMilk || 1)) * 75 + 15, 12);
                const isDay11 = pt.day === 11;
                const isLatest = idx === (production_history_14d?.length || 0) - 1;
                const prevPt = idx > 0 ? production_history_14d[idx - 1] : null;
                const diffFromPrev = prevPt ? Math.round((pt.milk_litres - prevPt.milk_litres) * 10) / 10 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                    {/* Rich Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition duration-150 absolute -top-16 bg-stone-900 text-white text-[10px] p-2 rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-30">
                      <div className="font-bold text-amber-300">
                        Day {pt.day} ({pt.date}): {pt.milk_litres} L
                      </div>
                      {prevPt && (
                        <div className={`font-semibold ${diffFromPrev < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {diffFromPrev < 0 ? `Change: ${diffFromPrev} L` : diffFromPrev > 0 ? `Change: +${diffFromPrev} L` : 'Steady (0 L)'} vs D{prevPt.day} ({prevPt.milk_litres} L)
                        </div>
                      )}
                      <div className="text-stone-300 text-[9px]">
                        Temp: {pt.avg_temp_c}°C • Water: {pt.water_litres_per_cow} L/cow
                      </div>
                    </div>

                    {/* Day 11 Visible Drop Pin / Badge */}
                    {isDay11 && (
                      <div className="absolute -top-7 flex flex-col items-center animate-bounce z-20">
                        <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                          ▼ -35 L Drop
                        </span>
                        <div className="w-1.5 h-1.5 bg-rose-600 rotate-45 -mt-0.5" />
                      </div>
                    )}

                    {isLatest && !isDay11 && (
                      <span className="text-[10px] font-bold text-emerald-700 mb-1">
                        {pt.milk_litres}L
                      </span>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[24px] rounded-t-lg transition-all duration-300 ${
                        isDay11
                          ? 'bg-rose-500 ring-2 ring-rose-400 group-hover:bg-rose-600 shadow-xs'
                          : isLatest
                          ? 'bg-emerald-600'
                          : pt.milk_litres < 420
                          ? 'bg-rose-400/80 group-hover:bg-rose-500'
                          : 'bg-emerald-500/80 group-hover:bg-emerald-600'
                      }`}
                    />

                    <span className={`text-[10px] mt-1 font-mono ${isDay11 ? 'font-bold text-rose-600' : 'text-stone-400'}`}>
                      D{pt.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/70 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Day 11 Production Shock:</strong> Herd yield plummeted by exactly <strong>35.0 Litres</strong> (from 445.0 L baseline to 410.0 L, -7.87%) triggered by THI 86.8 summer heat stress.
              </span>
            </div>
            {onNavigateToArena && (
              <button
                onClick={onNavigateToArena}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-emerald-50 transition shrink-0 self-start sm:self-auto"
              >
                Analyze Countermeasures &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. Active Herd Attention Animals Table with Merck Vital Signs */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>High-Risk / Individual Observation Animals ({animals_requiring_attention?.length || 0})</span>
            </h3>
            <p className="text-xs text-stone-500">
              Evaluated against Merck Veterinary Manual physiological resting ranges (HR 48-84 BPM, Temp 38.0-39.3°C, Resp 26-50 bpm)
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full self-start sm:self-auto">
            Merck Clinical Triage Standards
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3">Tag</th>
                <th className="pb-3">Breed</th>
                <th className="pb-3">Heart Rate (Merck: 48-84)</th>
                <th className="pb-3">Rectal Temp (38-39.3°C)</th>
                <th className="pb-3">Respiration (26-50)</th>
                <th className="pb-3">Observation</th>
                <th className="pb-3 text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(animals_requiring_attention || []).map((animal) => {
                const hr = animal.heart_rate_bpm ?? 72;
                return (
                  <tr key={animal.animal_tag} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 font-mono font-bold text-stone-900">{animal.animal_tag}</td>
                    <td className="py-3 font-medium text-stone-600">{animal.breed}</td>
                    <td className="py-3 font-mono">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          hr > 84
                            ? 'bg-rose-100 text-rose-800'
                            : hr < 48
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <Heart className="w-3 h-3" />
                        <span>{hr} BPM</span>
                      </span>
                    </td>
                    <td className="py-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          animal.rectal_temperature_celsius > 39.3
                            ? 'bg-rose-100 text-rose-800'
                            : animal.rectal_temperature_celsius < 38.0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {animal.rectal_temperature_celsius}°C
                      </span>
                    </td>
                    <td className="py-3 font-mono text-stone-600">
                      <span
                        className={`font-semibold ${
                          animal.respiration_rate_bpm > 50 ? 'text-rose-700 font-bold' : ''
                        }`}
                      >
                        {animal.respiration_rate_bpm} bpm
                      </span>
                    </td>
                    <td className="py-3 text-stone-600 max-w-xs">{animal.suspected_issue}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onNavigateToCowReport && (
                          <button
                            onClick={() => onNavigateToCowReport(animal.animal_tag)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
                            title={`Open full health & milk dossier for ${animal.animal_tag}`}
                          >
                            <span>Full Dossier &rarr;</span>
                          </button>
                        )}
                        {animal.veterinary_escalation ? (
                          <button
                            onClick={() => setSelectedVetAnimal(animal)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                            <span>Why Vet Recommended?</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedVetAnimal(animal)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-[11px] font-semibold transition cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-stone-500" />
                            <span>Vitals Detail</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Veterinary Explainability Modal */}
      <VeterinaryAlertModal
        animal={selectedVetAnimal}
        onClose={() => setSelectedVetAnimal(null)}
      />
    </div>
  );
};
