import React from 'react';
import type { AttentionAnimal, VeterinaryAssessment } from '../types';
import {
  X,
  Stethoscope,
  AlertTriangle,
  Heart,
  Thermometer,
  Wind,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  Info
} from 'lucide-react';

interface VeterinaryAlertModalProps {
  animal: AttentionAnimal | null;
  onClose: () => void;
}

export const VeterinaryAlertModal: React.FC<VeterinaryAlertModalProps> = ({ animal, onClose }) => {
  if (!animal) return null;

  const assessment: VeterinaryAssessment | undefined = animal.veterinary_assessment;

  // Fallback defaults if assessment not yet attached
  const hr = animal.heart_rate_bpm ?? 72;
  const temp = animal.rectal_temperature_celsius;
  const resp = animal.respiration_rate_bpm;

  const getUrgencyBadge = (urgency?: string) => {
    if (urgency?.includes('Critical')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Critical / Immediate Triage</span>
        </span>
      );
    }
    if (urgency?.includes('Prompt')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Prompt Clinical Attention</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-600 text-white shadow-xs flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        <span>Informational Monitoring</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 p-6 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <Stethoscope className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Clinical Decision Support
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Why are we recommending a veterinarian?
            </h2>
            <p className="text-xs text-stone-300">
              Animal Tag: <strong className="text-white font-mono">{animal.animal_tag}</strong> • {animal.breed} (DIM: {animal.days_in_milk}d)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Triage Urgency Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Assigned Clinical Triage
              </div>
              <div className="text-sm font-bold text-stone-800 mt-0.5">
                {animal.suspected_issue}
              </div>
            </div>
            {getUrgencyBadge(assessment?.urgency_level)}
          </div>

          {/* Vitals Evaluation against Merck Standards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Observed Vitals vs. Merck Veterinary Reference Standards</span>
              </h3>
              <span className="text-[10px] text-stone-400 font-medium">Adult Bovine at Rest</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Heart Rate */}
              <div className="p-4 rounded-2xl border bg-stone-50/60 border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Heart Rate</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      hr > 84 ? 'bg-rose-100 text-rose-800' : hr < 48 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {hr > 84 ? 'Elevated' : hr < 48 ? 'Depressed' : 'Normal'}
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {hr} <span className="text-xs font-normal text-stone-500">BPM</span>
                </div>
                <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                  Merck standard: <strong>48 - 84 BPM</strong>
                </div>
              </div>

              {/* Rectal Temperature */}
              <div className="p-4 rounded-2xl border bg-stone-50/60 border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rectal Temp</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      temp > 39.3 ? 'bg-rose-100 text-rose-800' : temp < 38.0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {temp > 39.3 ? 'Febrile' : temp < 38.0 ? 'Hypothermic' : 'Normal'}
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {temp}°C
                </div>
                <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                  Merck standard: <strong>38.0 - 39.3 °C</strong>
                </div>
              </div>

              {/* Respiration Rate */}
              <div className="p-4 rounded-2xl border bg-stone-50/60 border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <Wind className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Respiration</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      resp > 50 ? 'bg-rose-100 text-rose-800' : resp < 26 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {resp > 50 ? 'Tachypnea' : resp < 26 ? 'Bradypnea' : 'Normal'}
                  </span>
                </div>
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {resp} <span className="text-xs font-normal text-stone-500">bpm</span>
                </div>
                <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                  Merck standard: <strong>26 - 50 bpm</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Synergy & Scientific Rationale */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase text-[11px] tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Clinical Synergy & Pathological Analysis</span>
            </div>
            <p className="text-stone-700 leading-relaxed">
              {assessment?.clinical_synergy || (
                `Vitals evaluation indicates physiological compensation. Rectal temperature of ${temp}°C and respiration rate of ${resp} bpm warrant structured veterinary review.`
              )}
            </p>
          </div>

          {/* Why Vet Recommended Detail */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Why In-Person Examination is Required
            </h4>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 leading-relaxed">
              {assessment?.why_vet_recommended || (
                `Animal ${animal.animal_tag} exhibits physical signs requiring palpation, auscultation, or diagnostic sampling by a qualified veterinarian before commencing herd-wide feed or therapeutic changes.`
              )}
            </div>
          </div>

          {/* Immediate Action Protocol Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Immediate Farm Protocol (Prior to Vet Arrival)</span>
            </h4>
            <div className="space-y-2">
              {(assessment?.immediate_actions || [
                'Isolate the animal in a well-ventilated, shaded stall.',
                'Provide fresh, cool ad libitum drinking water.',
                'Monitor rectal temperature every 3 hours.',
                'Do not administer unprescribed systemic antibiotics without veterinary culture.'
              ]).map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700 p-2.5 rounded-xl bg-stone-50/80 border border-stone-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Citation & Disclaimer */}
          <div className="p-3 rounded-xl bg-stone-100 border border-stone-200/60 text-[10px] text-stone-500 space-y-1">
            <p className="font-semibold text-stone-600">
              Reference: {assessment?.reference_citation || 'Merck Veterinary Manual (Adult Bovine Vital Signs Standards)'}
            </p>
            <p>
              Disclaimer: FarmWise is a veterinary decision-support tool designed for early triage screening. It does not replace professional physical auscultation, diagnosis, or drug prescription by a licensed veterinarian.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
