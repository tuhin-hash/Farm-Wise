import React, { useState } from 'react';
import type { DashboardData, AttentionAnimal } from '../types';
import {
  TrendingDown,
  Thermometer,
  Droplets,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Award,
  Calendar,
  RefreshCw,
  Info,
  Stethoscope,
  Heart
} from 'lucide-react';
import { VeterinaryAlertModal } from './VeterinaryAlertModal';

interface HerdTrendsProps {
  dashboard: DashboardData | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const HerdTrendsView: React.FC<HerdTrendsProps> = ({ dashboard, onRefresh, isLoading }) => {
  const [activeMetric, setActiveMetric] = useState<'milk' | 'thi' | 'water'>('milk');
  const [selectedVetAnimal, setSelectedVetAnimal] = useState<AttentionAnimal | null>(null);

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-500">
        <Activity className="w-10 h-10 text-emerald-700 animate-pulse mb-3" />
        <p className="font-semibold text-stone-700">Loading Herd Analytics & Sensor Vitals...</p>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Herd Analytics & Environmental Correlation</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Correlating daily milk yield against Temperature-Humidity Index (THI) and water consumption trends.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
          <span>Refresh Trends</span>
        </button>
      </div>

      {/* Metric Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          onClick={() => setActiveMetric('milk')}
          className={`p-6 rounded-3xl border text-left transition-all ${
            activeMetric === 'milk'
              ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-stone-200/90 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Milk Production</span>
            <TrendingDown className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {dashboard.daily_production.current_litres} <span className="text-sm font-normal text-stone-500">L</span>
            <span className="text-xs text-rose-600 font-bold ml-2">
              {dashboard.daily_production.trend_percentage}%
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">Baseline: {dashboard.daily_production.baseline_litres} L/day (Persistent 3-day drop)</p>
        </button>

        <button
          onClick={() => setActiveMetric('thi')}
          className={`p-6 rounded-3xl border text-left transition-all ${
            activeMetric === 'thi'
              ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-stone-200/90 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">THI Thermal Load</span>
            <Thermometer className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">
            {dashboard.environmental_conditions.thi_index} <span className="text-sm font-normal text-stone-500">THI</span>
            <span className="text-xs text-amber-700 font-normal ml-2">
              ({dashboard.environmental_conditions.ambient_temperature_celsius}°C)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">Status: {dashboard.environmental_conditions.heat_stress_category.replace(/_/g, ' ')}</p>
        </button>

        <button
          onClick={() => setActiveMetric('water')}
          className={`p-6 rounded-3xl border text-left transition-all ${
            activeMetric === 'water'
              ? 'bg-cyan-50/70 border-cyan-400 shadow-sm ring-2 ring-cyan-500/20'
              : 'bg-white border-stone-200/90 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Water Intake</span>
            <Droplets className="w-4 h-4 text-cyan-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-900">
            {dashboard.water_consumption.current_litres_per_cow} <span className="text-sm font-normal text-stone-500">L/cow</span>
            <span className="text-xs text-cyan-700 font-bold ml-2">
              +{dashboard.water_consumption.trend_percentage}%
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">Alert: {dashboard.water_consumption.observation}</p>
        </button>
      </div>

      {/* 14-Day Detailed Rolling Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              {activeMetric === 'milk' && '14-Day Herd Milk Yield Trend (Litres)'}
              {activeMetric === 'thi' && '14-Day Ambient Temperature & Thermal Load (°C)'}
              {activeMetric === 'water' && '14-Day Water Intake per Lactating Cow (L/cow/day)'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Notice the inverse correlation: As temperatures surged on Day 11, water intake spiked and milk production declined.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>March 2026 Mandya Records</span>
          </div>
        </div>

        {/* Custom Bar Visualization */}
        <div className="h-68 w-full relative pt-6 pb-2">
          {/* Baseline guide line for Milk metric */}
          {activeMetric === 'milk' && (
            <div
              className="absolute left-6 right-0 border-t border-dashed border-emerald-400/80 z-0 flex items-center justify-end pr-2 pointer-events-none"
              style={{
                bottom: `${Math.min(Math.max(((445 - minMilk) / (maxMilk - minMilk || 1)) * 170 + 26, 20), 220)}px`
              }}
            >
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
                445 L Baseline
              </span>
            </div>
          )}

          <div className="absolute inset-0 flex items-end justify-between gap-2 pt-6 pb-8 pl-4">
            {history.map((pt, idx) => {
              let val = pt.milk_litres;
              let heightPct = ((val - minMilk) / (maxMilk - minMilk || 1)) * 75 + 15;
              let barColor = 'bg-emerald-600';
              let displayVal = `${val} L`;
              const isDay11 = pt.day === 11;
              const prevPt = idx > 0 ? history[idx - 1] : null;

              if (activeMetric === 'thi') {
                val = pt.avg_temp_c;
                heightPct = ((val - minTemp) / (maxTemp - minTemp || 1)) * 75 + 15;
                barColor = 'bg-amber-500';
                displayVal = `${val}°C`;
              } else if (activeMetric === 'water') {
                val = pt.water_litres_per_cow;
                heightPct = ((val - minWater) / (maxWater - minWater || 1)) * 75 + 15;
                barColor = 'bg-cyan-500';
                displayVal = `${val} L/cow`;
              }

              const isLatest = idx === history.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                  {/* Rich Tooltip */}
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition duration-150 bg-stone-900 text-white text-[10px] p-2 rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-30">
                    <div className="font-bold text-amber-300">
                      Day {pt.day} ({pt.date}): {displayVal}
                    </div>
                    {activeMetric === 'milk' && prevPt && (
                      <div className={`font-semibold ${pt.milk_litres < prevPt.milk_litres ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {pt.milk_litres < prevPt.milk_litres
                          ? `Change: ${Math.round((pt.milk_litres - prevPt.milk_litres) * 10) / 10} L`
                          : pt.milk_litres > prevPt.milk_litres
                          ? `Change: +${Math.round((pt.milk_litres - prevPt.milk_litres) * 10) / 10} L`
                          : 'Change: 0 L'}{' '}
                        vs D{prevPt.day} ({prevPt.milk_litres} L)
                      </div>
                    )}
                    <div className="text-stone-300 text-[9px]">
                      Temp: {pt.avg_temp_c}°C • Water: {pt.water_litres_per_cow} L/cow
                    </div>
                  </div>

                  {/* Day 11 Visible Drop Pin */}
                  {activeMetric === 'milk' && isDay11 && (
                    <div className="absolute -top-7 flex flex-col items-center animate-bounce z-20">
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        ▼ -35 L Drop
                      </span>
                      <div className="w-1.5 h-1.5 bg-rose-600 rotate-45 -mt-0.5" />
                    </div>
                  )}

                  {isLatest && !isDay11 && (
                    <span className="text-[10px] font-bold text-stone-900 mb-1">
                      {val}
                    </span>
                  )}

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 opacity-90 group-hover:opacity-100 ${
                      activeMetric === 'milk' && isDay11
                        ? 'bg-rose-500 ring-2 ring-rose-400 shadow-sm'
                        : barColor
                    }`}
                  />

                  <span className={`absolute bottom-0 text-[10px] truncate w-full text-center ${
                    activeMetric === 'milk' && isDay11 ? 'font-bold text-rose-600' : 'text-stone-400'
                  }`}>
                    D{pt.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Causal Callout */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-900">Causal Pattern Identified:</strong> Production maintained a steady 445 L baseline until Day 10.
            On Day 11, ambient daytime temperatures surged to 35.5°C with 68% relative humidity (THI 86.8). Daily milk yield dropped by exactly <strong>35.0 Litres (-7.87%)</strong> to 410.0 L/day, while water consumption jumped from 68 L to 82 L/cow.
          </div>
        </div>
      </div>

      {/* Breed Composition & Attention Animals Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Herd Breed Composition */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Herd Breed Distribution</span>
          </h3>

          <div className="space-y-4 pt-1">
            {Object.entries(dashboard.breeds || {}).map(([breed, count]) => {
              const pct = Math.round((count / dashboard.animal_count) * 100);
              let colorClass = 'bg-emerald-600';
              if (breed.includes('Jersey')) colorClass = 'bg-amber-500';
              if (breed.includes('Gir')) colorClass = 'bg-indigo-600';

              return (
                <div key={breed}>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-stone-700">{breed.replace('_', ' ')}</span>
                    <span className="text-stone-500 font-mono">{count} cows ({pct}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-500">
            <strong className="text-stone-800">Metabolic Note:</strong> HF Cross cows (14 animals) show the highest vulnerability to thermal depression due to higher milk output and body mass.
          </div>
        </div>

        {/* Clinical Vitals Table with Merck Standards */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Animals Requiring Individual Attention ({dashboard.animals_requiring_attention?.length || 0})</span>
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold self-start sm:self-auto">
              Merck Clinical Standards
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Tag</th>
                  <th className="pb-3">Breed</th>
                  <th className="pb-3">Heart Rate (48-84)</th>
                  <th className="pb-3">Rectal Temp</th>
                  <th className="pb-3">Respiration</th>
                  <th className="pb-3">Observation</th>
                  <th className="pb-3 text-right">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(dashboard.animals_requiring_attention || []).map((animal) => {
                  const hr = animal.heart_rate_bpm ?? 72;
                  return (
                    <tr key={animal.animal_tag} className="hover:bg-stone-50/60 transition">
                      <td className="py-3 font-mono font-bold text-stone-900">{animal.animal_tag}</td>
                      <td className="py-3 text-stone-600">{animal.breed}</td>
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
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                          animal.rectal_temperature_celsius > 39.3 ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-800'
                        }`}>
                          {animal.rectal_temperature_celsius}°C
                        </span>
                      </td>
                      <td className="py-3 font-mono font-medium">{animal.respiration_rate_bpm} bpm</td>
                      <td className="py-3 text-stone-600">
                        <div>{animal.suspected_issue}</div>
                        <div className="text-[10px] text-stone-400">{animal.appetite_observation}</div>
                      </td>
                      <td className="py-3 text-right">
                        {animal.veterinary_escalation ? (
                          <button
                            onClick={() => setSelectedVetAnimal(animal)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                          >
                            <Stethoscope className="w-3 h-3 text-rose-600" />
                            <span>Why Vet?</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedVetAnimal(animal)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-[11px] font-semibold transition cursor-pointer"
                          >
                            <Info className="w-3 h-3 text-stone-500" />
                            <span>Vitals</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              <strong>Clinical Guardrail:</strong> Individual clinical signs (fever, polypnea, tachycardia) are triaged directly to a registered veterinarian. FarmWise does not prescribe antibiotics or therapeutic medications.
            </span>
          </div>
        </div>
      </div>

      {/* Veterinary Alert Modal */}
      <VeterinaryAlertModal
        animal={selectedVetAnimal}
        onClose={() => setSelectedVetAnimal(null)}
      />
    </div>
  );
};
