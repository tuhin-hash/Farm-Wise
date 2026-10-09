import React, { useState } from 'react';
import type { DashboardData } from '../types';
import { TrendingDown, Thermometer, Droplets, AlertTriangle, Activity, ShieldAlert, Award, Calendar, RefreshCw } from 'lucide-react';

interface HerdTrendsProps {
  dashboard: DashboardData | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const HerdTrendsView: React.FC<HerdTrendsProps> = ({ dashboard, onRefresh, isLoading }) => {
  const [activeMetric, setActiveMetric] = useState<'milk' | 'thi' | 'water'>('milk');

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Activity className="w-12 h-12 text-emerald-500 animate-pulse mb-3" />
        <p>Loading herd analytics...</p>
      </div>
    );
  }

  const history = dashboard.production_history_14d || [];
  const maxMilk = Math.max(...history.map(h => h.milk_litres), 480);
  const minMilk = Math.min(...history.map(h => h.milk_litres), 390);

  const maxTemp = Math.max(...history.map(h => h.avg_temp_c), 38);
  const minTemp = Math.min(...history.map(h => h.avg_temp_c), 26);

  const maxWater = Math.max(...history.map(h => h.water_litres_per_cow), 90);
  const minWater = Math.min(...history.map(h => h.water_litres_per_cow), 55);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Herd Analytics & Environmental Correlation</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              14-Day Rolling Window
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Correlating daily milk yield against Temperature-Humidity Index (THI) and water consumption trends
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Trends
        </button>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveMetric('milk')}
          className={`p-4 rounded-xl border text-left transition ${
            activeMetric === 'milk'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Milk Production</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {dashboard.daily_production.current_litres} L
            <span className="text-xs text-rose-400 font-normal ml-2">
              {dashboard.daily_production.trend_percentage}% vs baseline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Baseline: {dashboard.daily_production.baseline_litres} L/day (3-day drop detected)</p>
        </button>

        <button
          onClick={() => setActiveMetric('thi')}
          className={`p-4 rounded-xl border text-left transition ${
            activeMetric === 'thi'
              ? 'bg-amber-950/40 border-amber-500/50 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">THI & Ambient Heat</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {dashboard.environmental_conditions.thi_index} THI
            <span className="text-xs text-amber-400 font-normal ml-2">
              ({dashboard.environmental_conditions.ambient_temperature_celsius}°C)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Status: {dashboard.environmental_conditions.heat_stress_category} (Threshold: 72)</p>
        </button>

        <button
          onClick={() => setActiveMetric('water')}
          className={`p-4 rounded-xl border text-left transition ${
            activeMetric === 'water'
              ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Water Intake</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {dashboard.water_consumption.current_litres_per_cow} L/cow
            <span className="text-xs text-cyan-400 font-normal ml-2">
              +{dashboard.water_consumption.trend_percentage}% vs baseline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Alert: {dashboard.water_consumption.observation}</p>
        </button>
      </div>

      {/* 14-Day Chart Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {activeMetric === 'milk' && '14-Day Herd Milk Yield Trend (Litres)'}
              {activeMetric === 'thi' && '14-Day Ambient Temperature & Thermal Load (°C)'}
              {activeMetric === 'water' && '14-Day Water Intake per Lactating Cow (L/cow/day)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Notice the inverse correlation: As temperatures surged on Day 11, water intake spiked and milk production declined.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>March 2026 Simulation</span>
          </div>
        </div>

        {/* Custom SVG Bar / Line Chart */}
        <div className="h-64 w-full relative">
          <div className="absolute inset-0 flex items-end justify-between gap-1.5 pt-6 pb-8">
            {history.map((pt, idx) => {
              let val = pt.milk_litres;
              let heightPct = ((val - minMilk) / (maxMilk - minMilk || 1)) * 80 + 10;
              let barColor = 'from-emerald-600 to-emerald-400';
              let displayVal = `${val}L`;

              if (activeMetric === 'thi') {
                val = pt.avg_temp_c;
                heightPct = ((val - minTemp) / (maxTemp - minTemp || 1)) * 80 + 10;
                barColor = 'from-amber-600 to-amber-400';
                displayVal = `${val}°C`;
              } else if (activeMetric === 'water') {
                val = pt.water_litres_per_cow;
                heightPct = ((val - minWater) / (maxWater - minWater || 1)) * 80 + 10;
                barColor = 'from-cyan-600 to-cyan-400';
                displayVal = `${val}L`;
              }

              const isLatest = idx === history.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 text-slate-100 text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                    <span className="font-semibold">{pt.date}</span>: {displayVal}
                  </div>

                  {/* Value on top of bar for latest or peak */}
                  {isLatest && (
                    <span className="text-[10px] font-bold text-emerald-400 mb-1">
                      {val}
                    </span>
                  )}

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-md bg-gradient-to-t ${barColor} transition-all duration-500 opacity-80 group-hover:opacity-100 shadow-sm`}
                  />

                  {/* X Axis Label */}
                  <span className="absolute bottom-0 text-[10px] text-slate-400 truncate w-full text-center">
                    D{pt.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight callout */}
        <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-100">Causal Pattern Detected:</strong> Baseline production held steady at 450 L until Day 10.
            Between Day 11 and Day 14, ambient daytime temperatures rose to 34.5°C with 68% relative humidity (THI 86.8). Water intake jumped from 68 L to 82 L/cow, and milk output dropped by 40 L/day (-8.9%).
          </div>
        </div>
      </div>

      {/* Herd Composition & Individual Attention Animals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Herd Composition */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Herd Breed Composition
          </h3>
          <div className="space-y-4">
            {Object.entries(dashboard.breeds || {}).map(([breed, count]) => {
              const pct = Math.round((count / dashboard.animal_count) * 100);
              let colorClass = 'bg-emerald-500';
              if (breed.includes('Jersey')) colorClass = 'bg-amber-500';
              if (breed.includes('Gir')) colorClass = 'bg-indigo-500';

              return (
                <div key={breed}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{breed.replace('_', ' ')}</span>
                    <span className="text-slate-400 font-mono">{count} cows ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            <div className="font-semibold text-slate-300 mb-1">Heat Vulnerability Note:</div>
            HF Cross cattle (14 head) have higher metabolic heat generation and are showing the steepest decline in dry matter intake under THI &gt; 80.
          </div>
        </div>

        {/* Attention Animals Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              High-Risk / Individual Observation Animals ({dashboard.animals_requiring_attention?.length || 0})
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Veterinary Review Triaged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="pb-2">Tag</th>
                  <th className="pb-2">Breed</th>
                  <th className="pb-2">Rectal Temp</th>
                  <th className="pb-2">Resp. Rate</th>
                  <th className="pb-2">Observation</th>
                  <th className="pb-2">Action / Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(dashboard.animals_requiring_attention || []).map((animal) => (
                  <tr key={animal.animal_tag} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 font-mono font-bold text-amber-400">{animal.animal_tag}</td>
                    <td className="py-2.5 text-slate-300">{animal.breed}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded font-mono ${
                        animal.rectal_temperature_celsius >= 39.5 ? 'bg-rose-500/20 text-rose-300' : 'text-slate-300'
                      }`}>
                        {animal.rectal_temperature_celsius}°C
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">{animal.respiration_rate_bpm} bpm</td>
                    <td className="py-2.5 text-slate-300">
                      <div>{animal.suspected_issue}</div>
                      <div className="text-[10px] text-slate-500">{animal.appetite_observation}</div>
                    </td>
                    <td className="py-2.5">
                      {animal.veterinary_escalation ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Vet Call Req.
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">{animal.action_required}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl text-rose-300/80 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>
              <strong>Clinical Guardrail:</strong> Individual clinical signs (fever, polypnea) are triaged directly to a registered veterinarian. FarmWise does not prescribe antibiotics or therapeutic medications.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
