import React from 'react';
import { ShieldCheck, AlertCircle, Cpu, UserCheck } from 'lucide-react';

export const ResponsibleAIFooter: React.FC = () => {
  return (
    <footer className="mt-12 pt-8 pb-12 border-t border-slate-800 text-xs text-slate-400">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Governance Column 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Veterinary Clinical Boundary</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            FarmWise is strictly a <strong>Decision-Support System</strong> for nutritional and management planning.
            It does <strong>not</strong> diagnose veterinary pathology, prescribe antibiotics, or replace qualified livestock medical professionals. High-fever animals are flagged for immediate veterinary triage.
          </p>
        </div>

        {/* Governance Column 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Math & No Hallucination</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            All financial arithmetic, feed ration crude protein/TDN blending, and strategy ranking use deterministic Python calculators and verified nutritional datasets (ICAR/KMF reference values). LLMs do not calculate financial numbers.
          </p>
        </div>

        {/* Governance Column 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Transparent Assumptions & Risk</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Candidate strategies declare explicit operational risks, feasibility trade-offs, and missing data points before scoring. If farmer input data is incomplete, the system raises warnings rather than fabricating facts.
          </p>
        </div>

        {/* Governance Column 4 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Farmer Sovereignty</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The farmer retains 100% final operational control. The system evaluates the farmer’s traditional practice side-by-side with AI strategies, allowing the user to select, override, or record true field outcomes.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            <strong>FarmWise MVP</strong> — Synthetic Dairy Dataset (Mandya, Karnataka: 24 Crossbred Cows, 410 L/day, ₹38/L)
          </span>
        </div>
        <div>
          <span>Your experience. More evidence. Better farm decisions.</span>
        </div>
      </div>
    </footer>
  );
};
