import React, { useState, useEffect } from 'react';
import {
  Heart,
  Thermometer,
  Activity,
  ShieldAlert,
  Stethoscope,
  Printer,
  Send,
  Droplets,
  Calendar,
  Info,
  CheckCircle2,
  Phone,
  ArrowRight,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { CowSummary, CowDossier } from '../types';

interface SingleCowReportViewProps {
  initialAnimalTag?: string;
  onSelectAnimalTag?: (tag: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SingleCowReportView: React.FC<SingleCowReportViewProps> = ({
  initialAnimalTag = 'KA-MAN-104',
  onSelectAnimalTag,
  onNavigateTab
}) => {
  const [cows, setCows] = useState<CowSummary[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>(initialAnimalTag);
  const [dossier, setDossier] = useState<CowDossier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingSMS, setIsSendingSMS] = useState<boolean>(false);
  const [smsPhone, setSmsPhone] = useState<string>('+919876543210');
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load all cows catalog
  useEffect(() => {
    const fetchCows = async () => {
      try {
        const res = await api.getCows('demo-farm-01');
        if (res && res.cows && res.cows.length > 0) {
          setCows(res.cows);
        }
      } catch (err) {
        console.warn('Could not load cow catalog from API, using fallback list', err);
        // Fallback cow catalog
        setCows([
          {
            animal_tag: 'KA-MAN-104',
            breed: 'HF Cross (62.5% Holstein)',
            category: 'HF_Cross',
            days_in_milk: 84,
            parity: 2,
            calving_date: '2026-02-19',
            current_daily_yield_litres: 14.5,
            baseline_daily_yield_litres: 22.0,
            heart_rate_bpm: 105,
            rectal_temperature_celsius: 39.9,
            respiration_rate_bpm: 74,
            rumen_contractions_per_2min: 1,
            rumen_fill_score: 2,
            locomotion_score: 2,
            california_mastitis_risk: 'Trace',
            appetite_observation: 'Severe feed refusal (left 60% concentrate uneaten)',
            suspected_issue: 'Elevated thermal distress / systemic pyrexia with resting tachycardia',
            urgency_level: 'CRITICAL_TRIAGE',
            veterinary_escalation: true,
            health_status: 'CRITICAL'
          },
          {
            animal_tag: 'KA-MAN-112',
            breed: 'Jersey Cross (50% Jersey)',
            category: 'Jersey_Cross',
            days_in_milk: 142,
            parity: 3,
            calving_date: '2025-12-23',
            current_daily_yield_litres: 11.0,
            baseline_daily_yield_litres: 17.0,
            heart_rate_bpm: 76,
            rectal_temperature_celsius: 38.8,
            respiration_rate_bpm: 48,
            rumen_contractions_per_2min: 2,
            rumen_fill_score: 3,
            locomotion_score: 1,
            california_mastitis_risk: '2+ Acute High Risk (Right Rear Quarter)',
            appetite_observation: 'Sluggish movement, eating green fodder only',
            suspected_issue: 'Localized quarter firmness with 35% individual yield drop (Clinical Mastitis indicator)',
            urgency_level: 'PROMPT_ATTENTION',
            veterinary_escalation: true,
            health_status: 'WARNING'
          },
          {
            animal_tag: 'KA-MAN-118',
            breed: 'Gir Cross (Indigenous Cross)',
            category: 'Gir_Indigenous',
            days_in_milk: 58,
            parity: 1,
            calving_date: '2026-03-17',
            current_daily_yield_litres: 13.5,
            baseline_daily_yield_litres: 14.5,
            heart_rate_bpm: 86,
            rectal_temperature_celsius: 39.1,
            respiration_rate_bpm: 52,
            rumen_contractions_per_2min: 3,
            rumen_fill_score: 4,
            locomotion_score: 1,
            california_mastitis_risk: 'Negative',
            appetite_observation: 'Normal appetite, active rumination observed',
            suspected_issue: 'Mild isolated elevation in resting pulse during peak afternoon heat',
            urgency_level: 'ROUTINE_MONITORING',
            veterinary_escalation: false,
            health_status: 'OBSERVATION'
          },
          {
            animal_tag: 'KA-MAN-101',
            breed: 'HF Cross (75% Holstein)',
            category: 'HF_Cross',
            days_in_milk: 110,
            parity: 2,
            calving_date: '2026-01-24',
            current_daily_yield_litres: 21.0,
            baseline_daily_yield_litres: 23.5,
            heart_rate_bpm: 68,
            rectal_temperature_celsius: 38.6,
            respiration_rate_bpm: 36,
            rumen_contractions_per_2min: 3,
            rumen_fill_score: 4,
            locomotion_score: 1,
            california_mastitis_risk: 'Negative',
            appetite_observation: 'Vigorous appetite, chewing cud actively',
            suspected_issue: 'None. Healthy high-producing lactating cow',
            urgency_level: 'NORMAL',
            veterinary_escalation: false,
            health_status: 'HEALTHY'
          }
        ]);
      }
    };
    fetchCows();
  }, []);

  // Fetch dossier for selected cow
  const loadCowDossier = async (tag: string) => {
    setIsLoading(true);
    setError(null);
    setSmsStatus(null);
    try {
      const data = await api.getCowDossier(tag, 'demo-farm-01');
      if (data) {
        setDossier(data);
      }
    } catch (err: any) {
      console.warn('Could not load dossier from API, constructing fallback dossier for', tag, err);
      // Fallback local dossier generator if backend is momentarily uncontacted
      const matchedCow = cows.find(c => c.animal_tag === tag) || cows[0];
      if (matchedCow) {
        setDossier({
          farm_id: 'demo-farm-01',
          farm_name: 'NammaHerd Dairy',
          location: 'Mandya, Karnataka',
          generated_at: new Date().toISOString(),
          cow: matchedCow,
          reference_standard: 'Merck Veterinary Manual (Adult Bovine Physiological Norms)',
          vital_ranges: {
            rectal_temperature_celsius: { min: 38.0, max: 39.3, unit: '°C', description: 'Resting core body temperature' },
            heart_rate_bpm: { min: 48, max: 84, unit: 'BPM', description: 'Resting cardiac pulse' },
            respiration_rate_bpm: { min: 26, max: 50, unit: 'bpm', description: 'Resting flank respiratory rate' },
            rumen_contractions_per_2min: { min: 2, max: 3, unit: 'cycles / 2min', description: 'Primary ruminal motility' }
          },
          environmental_thi: 86.8,
          production_history_14d: Array.from({ length: 14 }, (_, i) => {
            const day = i + 1;
            const isShock = day >= 11;
            const yieldVal = isShock
              ? Math.max(10.0, matchedCow.current_daily_yield_litres - (day === 11 ? 1.5 : 0))
              : matchedCow.baseline_daily_yield_litres;
            return {
              day,
              date: `2026-05-${String(day).padStart(2, '0')}`,
              milk_litres: Math.round(yieldVal * 10) / 10,
              baseline_litres: matchedCow.baseline_daily_yield_litres,
              thi: day >= 10 ? 86.8 : 71.5,
              status: isShock ? 'Heat Stress Impact' : 'Normal Baseline',
              notes: day === 11 ? 'Sudden -7.5L drop' : 'Stable'
            };
          }),
          individual_ration: {
            concentrate_kg: matchedCow.category === 'HF_Cross' ? 6.0 : 4.5,
            green_fodder_kg: 22.0,
            dry_fodder_kg: 5.0,
            mineral_mixture_grams: 120,
            clean_water_requirement_litres: 110.0,
            notes: 'High water requirement due to THI 86.8 ambient load.'
          },
          immediate_farm_actions: [
            matchedCow.veterinary_escalation
              ? 'Immediately relocate animal to shaded, fan-assisted recovery bay.'
              : 'Maintain ad-libitum clean, cool drinking water.',
            matchedCow.rectal_temperature_celsius > 39.3
              ? 'Apply cold water drenching over poll, neck, and dorsal spine every 30 minutes.'
              : 'Offer feed during early morning (06:00) and late evening (19:30).',
            matchedCow.veterinary_escalation
              ? 'Request licensed veterinary emergency physical examination.'
              : 'Record evening milk yield and rumination rate.'
          ],
          responsible_ai_disclaimer: 'Clinical decision support only. FarmWise does not prescribe pharmaceuticals or replace physical diagnostic evaluation by a registered veterinary practitioner.'
        });
      } else {
        setError('Cow record could not be loaded.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTag) {
      loadCowDossier(selectedTag);
    }
  }, [selectedTag]);

  const handleSelectCow = (tag: string) => {
    setSelectedTag(tag);
    if (onSelectAnimalTag) {
      onSelectAnimalTag(tag);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendCowSMS = async () => {
    if (!dossier) return;
    setIsSendingSMS(true);
    setSmsStatus(null);
    try {
      const cow = dossier.cow;
      const msg = `FarmWise Cow Alert [${cow.animal_tag}]: Temp ${cow.rectal_temperature_celsius}°C, HR ${cow.heart_rate_bpm} BPM. Yield dropped from ${cow.baseline_daily_yield_litres}L to ${cow.current_daily_yield_litres}L. Status: ${cow.urgency_level}.`;
      const res = await api.sendTestSMS({
        phone_number: smsPhone,
        message: msg,
        language: 'en'
      });
      setSmsStatus(`SMS notification successfully ${res.status} to ${smsPhone}. Provider: ${res.provider}`);
    } catch (err: any) {
      setSmsStatus(`Failed to send SMS: ${err.message || 'Network error'}`);
    } finally {
      setIsSendingSMS(false);
    }
  };

  const currentCow = dossier?.cow || cows.find(c => c.animal_tag === selectedTag) || cows[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
      case 'CRITICAL_TRIAGE':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          label: 'Critical Triage'
        };
      case 'WARNING':
      case 'PROMPT_ATTENTION':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-600',
          label: 'Prompt Attention'
        };
      case 'OBSERVATION':
      case 'ROUTINE_MONITORING':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-600',
          label: 'Under Observation'
        };
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          label: 'Healthy Baseline'
        };
    }
  };

  const badge = getStatusBadge(currentCow?.health_status || 'HEALTHY');

  // Individual milk chart stats
  const history = dossier?.production_history_14d || [];
  const yields = history.map(h => h.milk_litres);
  const minYield = yields.length > 0 ? Math.min(...yields, 5) : 10;
  const maxYield = yields.length > 0 ? Math.max(...yields, 25) : 25;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80">
              <Stethoscope className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Clinical Livestock Informatics
            </span>
            <span className="text-xs text-stone-400">• NammaHerd Dairy (Mandya)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Single Cow Health & Production Dossier
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Individual animal diagnostic record evaluated against <strong>Merck Veterinary Manual</strong> physiological
            reference limits, ICAR lactation requirements, and real-time Mandya weather telemetry.
          </p>
        </div>

        {/* Quick Actions (Print & Triage) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Print Clinical Dossier"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>Print Dossier</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('overview')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Farm Overview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Cow Selector Tabs Bar */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200/90 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-bold text-stone-500 uppercase px-2">Select Animal:</span>
          {cows.map((c) => {
            const isSelected = c.animal_tag === selectedTag;
            const b = getStatusBadge(c.health_status);
            return (
              <button
                key={c.animal_tag}
                onClick={() => handleSelectCow(c.animal_tag)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                <span className="font-mono">{c.animal_tag}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : b.bg
                }`}>
                  {c.category.replace('_', ' ')}
                </span>
                {c.veterinary_escalation && (
                  <ShieldAlert className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'text-rose-600'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-stone-700">Loading Clinical Dossier for {selectedTag}...</p>
          <p className="text-xs text-stone-400">Grounding physiological telemetry against Merck Bovine reference standards.</p>
        </div>
      ) : currentCow ? (
        <div className="space-y-6">
          {/* Key Animal Identity & Status Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Identity Card */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Animal Ear Tag</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
              <div>
                <div className="text-3xl font-black font-mono text-stone-900">{currentCow.animal_tag}</div>
                <div className="text-xs font-semibold text-stone-600 mt-0.5">{currentCow.breed}</div>
              </div>
              <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-400 block">Days in Milk:</span>
                  <span className="font-bold text-stone-800">{currentCow.days_in_milk} DIM</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Parity:</span>
                  <span className="font-bold text-stone-800">Lactation #{currentCow.parity}</span>
                </div>
              </div>
            </div>

            {/* Daily Milk Shock Metric */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Yield</span>
                <span className="text-[11px] font-bold text-stone-500">Baseline: {currentCow.baseline_daily_yield_litres} L</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-stone-900">{currentCow.current_daily_yield_litres}</span>
                  <span className="text-sm font-bold text-stone-500">L / day</span>
                </div>
                {currentCow.current_daily_yield_litres < currentCow.baseline_daily_yield_litres ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-rose-600 mt-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>
                      -{(currentCow.baseline_daily_yield_litres - currentCow.current_daily_yield_litres).toFixed(1)} L (
                      {(
                        ((currentCow.baseline_daily_yield_litres - currentCow.current_daily_yield_litres) /
                          currentCow.baseline_daily_yield_litres) *
                        100
                      ).toFixed(1)}
                      % drop)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operating at full baseline</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                Calved on: <strong className="text-stone-700">{currentCow.calving_date}</strong>
              </div>
            </div>

            {/* Clinical Observation Alert */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Primary Clinical Finding</span>
                {currentCow.veterinary_escalation ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Veterinary Escalation Required
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    No Emergency Escalation
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-stone-900 leading-snug">
                {currentCow.suspected_issue}
              </div>
              <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <strong>Appetite & Behavior:</strong> {currentCow.appetite_observation}
              </div>
            </div>
          </div>

          {/* Physiological Vitals vs Merck Manual Reference Standards */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-700" />
                  <span>Merck Veterinary Manual Physiological Resting Norms</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automated comparison of physical signs against adult bovine reference standard (Merck 11th Edition)
                </p>
              </div>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full self-start sm:self-auto">
                Bovine Vital Signs Standard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Vital 1: Rectal Temp */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  currentCow.rectal_temperature_celsius > 39.3
                    ? 'bg-rose-50/70 border-rose-200'
                    : currentCow.rectal_temperature_celsius < 38.0
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-stone-50/80 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-700">
                    <Thermometer className="w-4 h-4 text-rose-600" />
                    <span>Rectal Temp</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Merck: 38.0-39.3°C</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {currentCow.rectal_temperature_celsius}
                  </span>
                  <span className="text-xs font-bold text-stone-500">°C</span>
                  {currentCow.rectal_temperature_celsius > 39.3 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900">
                      Pyrexia (+{(currentCow.rectal_temperature_celsius - 39.3).toFixed(1)}°C)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 leading-tight">
                  {currentCow.rectal_temperature_celsius > 39.3
                    ? 'Thermal stress or systemic pyrexia. Requires cooling intervention.'
                    : 'Within physiological resting core body temperature limits.'}
                </div>
              </div>

              {/* Vital 2: Heart Rate */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  currentCow.heart_rate_bpm > 84
                    ? 'bg-rose-50/70 border-rose-200'
                    : currentCow.heart_rate_bpm < 48
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-stone-50/80 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-700">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Cardiac Pulse</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Merck: 48-84 BPM</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {currentCow.heart_rate_bpm}
                  </span>
                  <span className="text-xs font-bold text-stone-500">BPM</span>
                  {currentCow.heart_rate_bpm > 84 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900">
                      Tachycardia (+{currentCow.heart_rate_bpm - 84})
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 leading-tight">
                  {currentCow.heart_rate_bpm > 84
                    ? 'Cardiovascular compensations to dissipate heat load.'
                    : 'Normal resting bovine heart rate.'}
                </div>
              </div>

              {/* Vital 3: Respiration Rate */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  currentCow.respiration_rate_bpm > 50
                    ? 'bg-rose-50/70 border-rose-200'
                    : currentCow.respiration_rate_bpm < 26
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-stone-50/80 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-700">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Respiration</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Merck: 26-50 bpm</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {currentCow.respiration_rate_bpm}
                  </span>
                  <span className="text-xs font-bold text-stone-500">bpm</span>
                  {currentCow.respiration_rate_bpm > 50 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900">
                      Tachypnea
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 leading-tight">
                  {currentCow.respiration_rate_bpm > 50
                    ? 'Panting behavior / evaporative cooling through respiratory tract.'
                    : 'Quiet, unlabored resting flank movements.'}
                </div>
              </div>

              {/* Vital 4: Rumen Contractions */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  currentCow.rumen_contractions_per_2min < 2
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-stone-50/80 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-700">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>Rumen Motility</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Merck: 2-3 / 2min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-stone-900">
                    {currentCow.rumen_contractions_per_2min}
                  </span>
                  <span className="text-xs font-bold text-stone-500">/ 2min</span>
                  {currentCow.rumen_contractions_per_2min < 2 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900">
                      Hypomotility
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-600 leading-tight">
                  {currentCow.rumen_contractions_per_2min < 2
                    ? 'Suppressed fermentation; feed intake reduced.'
                    : 'Active primary and secondary ruminal contractions.'}
                </div>
              </div>
            </div>

            {/* Additional Physical Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Rumen Fill Score (1-5)</span>
                <span className="font-bold text-stone-800 text-sm">
                  {currentCow.rumen_fill_score} / 5{' '}
                  <span className="text-stone-500 font-normal text-xs">
                    ({currentCow.rumen_fill_score <= 2 ? 'Inadequate recent feed intake' : 'Good rumen fill'})
                  </span>
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Locomotion Score (1-5)</span>
                <span className="font-bold text-stone-800 text-sm">
                  {currentCow.locomotion_score} / 5{' '}
                  <span className="text-stone-500 font-normal text-xs">
                    ({currentCow.locomotion_score === 1 ? 'Normal steady gait' : 'Slight hesitation'})
                  </span>
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">California Mastitis (CMT)</span>
                <span className="font-bold text-stone-800 text-sm">
                  {currentCow.california_mastitis_risk}
                </span>
              </div>
            </div>
          </div>

          {/* 14-Day Individual Milk Production Trend Shock Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                  <span>14-Day Individual Milk Yield Curve</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Individual production across recent May recording window. Baseline: {currentCow.baseline_daily_yield_litres} L/day.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="inline-block w-3 h-3 rounded-xs bg-emerald-600" />
                <span className="text-stone-600">Daily Milk (L)</span>
                <span className="inline-block w-3 h-3 rounded-xs bg-rose-500 ml-2" />
                <span className="text-stone-600">Shock Drop (Day 11)</span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-stone-100">
              {history.map((pt) => {
                const heightPct = Math.max(((pt.milk_litres - minYield) / (maxYield - minYield || 1)) * 75 + 15, 12);
                const isDay11 = pt.day === 11;
                return (
                  <div key={pt.day} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition duration-150 absolute -top-14 bg-stone-900 text-white text-[10px] p-2 rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-30">
                      <div className="font-bold text-amber-300">Day {pt.day}: {pt.milk_litres} L</div>
                      <div className="text-stone-300">Baseline: {pt.baseline_litres} L • THI: {pt.thi}</div>
                    </div>

                    {isDay11 && (
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1 rounded-sm mb-1">
                        -Drop
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-stone-600 mb-1 group-hover:text-emerald-700">
                      {pt.milk_litres}
                    </span>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                        isDay11 ? 'bg-rose-500 ring-2 ring-rose-400' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-stone-400 mt-2">D{pt.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Action Plan & Ration Allocation Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Immediate Farm First-Aid & Vet Action Protocol */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200/80">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Immediate Farm Action Protocol</h3>
                  <p className="text-xs text-stone-500">First-aid guidance pending professional practitioner visit</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {(dossier?.immediate_farm_actions || []).map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200/70 text-xs text-stone-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{action}</span>
                  </div>
                ))}
              </div>

              {/* Responsible AI Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Clinical Decision Support Boundary</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  {dossier?.responsible_ai_disclaimer ||
                    'Clinical decision support only. FarmWise does not prescribe pharmaceuticals or replace physical diagnostic evaluation by a registered veterinary practitioner.'}
                </p>
              </div>
            </div>

            {/* Individual Ration & Water Requirements */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-200/80">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Individual Ration & Water Requirement</h3>
                    <p className="text-xs text-stone-500">ICAR nutritional standard for {currentCow.category}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                  THI: {dossier?.environmental_thi || 86.8}
                </span>
              </div>

              {dossier?.individual_ration && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Grain Concentrate</span>
                    <span className="text-lg font-black text-stone-900">{dossier.individual_ration.concentrate_kg} kg</span>
                    <span className="text-stone-500 block text-[10px]">Split across 2 feeds</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Green Fodder</span>
                    <span className="text-lg font-black text-stone-900">{dossier.individual_ration.green_fodder_kg} kg</span>
                    <span className="text-stone-500 block text-[10px]">Co-4 / Napier grass</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Dry Fodder (Straw)</span>
                    <span className="text-lg font-black text-stone-900">{dossier.individual_ration.dry_fodder_kg} kg</span>
                    <span className="text-stone-500 block text-[10px]">Ragi / paddy straw</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200">
                    <span className="text-blue-800 block text-[10px] uppercase font-bold">Daily Clean Water</span>
                    <span className="text-lg font-black text-blue-950">
                      {dossier.individual_ration.clean_water_requirement_litres} L
                    </span>
                    <span className="text-blue-700 block text-[10px]">Elevated due to heatwave</span>
                  </div>
                </div>
              )}

              {/* SMS Alert Dispatcher for This Cow */}
              <div className="pt-3 border-t border-stone-100 space-y-2.5">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Send SMS Clinical Report for {currentCow.animal_tag}</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <button
                    onClick={handleSendCowSMS}
                    disabled={isSendingSMS}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isSendingSMS ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send SMS</span>
                  </button>
                </div>
                {smsStatus && (
                  <p className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200 animate-in fade-in">
                    {smsStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
