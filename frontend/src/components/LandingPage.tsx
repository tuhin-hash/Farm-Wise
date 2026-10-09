import {
  Sparkles,
  Compass,
  Sliders,
  Activity,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  ChevronRight,
  IndianRupee
} from 'lucide-react';
import { Farm3DView } from './Farm3DView';
import type { HealthResponse } from '../types';

interface LandingPageProps {
  onExplore: () => void;
  onOpenArena: () => void;
  onNavigateTab: (tab: string) => void;
  health: HealthResponse | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExplore,
  onOpenArena,
  onNavigateTab,
  health: _health
}) => {
  return (
    <div className="space-y-16 py-4">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062c1e] via-[#093c29] to-[#041d14] text-white p-8 md:p-14 shadow-xl border border-emerald-900/40">
        {/* Soft background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Brand & Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-700/60 backdrop-blur-md text-emerald-300 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FarmWise — Decision Intelligence for Livestock Farms</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Your farm. Your experience.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-200 bg-clip-text text-transparent">
              Smarter decisions.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed font-normal">
            FarmWise combines livestock records, nutrition, environmental conditions, and farm economics to help farmers compare decisions with clarity.
          </p>

          <p className="text-xs sm:text-sm text-emerald-300/80 font-medium tracking-wide">
            Your experience. More evidence. Better farm decisions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={onOpenArena}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-stone-950 text-sm font-extrabold shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-stone-950 fill-stone-950" />
              <span>Open Decision Arena</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-stone-900/80 hover:bg-stone-800/90 text-stone-100 text-sm font-bold border border-emerald-800/80 hover:border-emerald-700 transition shadow flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Explore FarmWise</span>
            </button>
          </div>

          {/* Real-time Status & Farm Proof Strip */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-emerald-950/50 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-800/40">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">Demo Herd</div>
              <div className="text-base font-bold text-white mt-0.5">24 Dairy Cows</div>
              <div className="text-[11px] text-emerald-300/70">Mandya, Karnataka</div>
            </div>

            <div className="bg-emerald-950/50 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-800/40">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">Environmental Stress</div>
              <div className="text-base font-bold text-amber-300 mt-0.5">THI 86.8 Thermal Load</div>
              <div className="text-[11px] text-amber-300/80">Moderate-to-Severe Heat</div>
            </div>

            <div className="bg-emerald-950/50 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-800/40">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">Multi-Agent Engine</div>
              <div className="text-base font-bold text-emerald-300 mt-0.5">6 Verified Agents</div>
              <div className="text-[11px] text-emerald-300/70">LangGraph Stateful Graph</div>
            </div>

            <div className="bg-emerald-950/50 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-800/40">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">Computation Type</div>
              <div className="text-base font-bold text-white mt-0.5">Deterministic Math</div>
              <div className="text-[11px] text-emerald-300/70">Zero Hallucinated Numbers</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE 3D FARM DIGITAL TWIN SHOWCASE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/90 px-3 py-1 rounded-full mb-1">
              <span>Interactive Digital Twin</span>
            </div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Explore Sri Lakshmi Dairy Farm in 3D
            </h2>
            <p className="text-sm text-stone-600">
              Rotate, zoom, and inspect real-time barn telemetry, silo feed inventories, and heat-stressed cows.
            </p>
          </div>
          <button
            onClick={onExplore}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition self-start sm:self-auto"
          >
            <span>View Full Farm Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Farm Canvas */}
        <Farm3DView onNavigate={onNavigateTab} compact={false} />
      </section>

      {/* 3. CORE VALUE PILLARS: WHY FARMWISE IS DIFFERENT */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Built for Real Farm Economics, Not Generic Chat
          </h2>
          <p className="text-sm text-stone-600">
            Most AI tools give vague advice without calculating costs or understanding your local feed availability. FarmWise puts hard numbers to work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Deterministic Financial Arithmetic</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We never let language models do math. Every rupee spent on feed or cooling intervention is computed deterministically with verified formulas down to the single rupee.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span>Strict Budget Constraint Enforcement</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <Thermometer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Environmental & THI Risk Modeling</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              When ambient temperatures spike above 34°C with high humidity (THI &gt; 80), cows cut feed intake. FarmWise correlates production dips with heat stress to prescribe shade and hydration protocols.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
              <span>Scientific Heat Index Algorithms</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Responsible Clinical Boundaries</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              FarmWise is an operational decision support system, not an autonomous vet. High-fever animals are instantly flagged for veterinary referral with zero hallucinated prescriptions.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
              <span>Immediate Clinical Escalation Guardrails</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE DECISION ARENA WALKTHROUGH */}
      <section className="bg-stone-900 text-white p-8 md:p-12 rounded-3xl border border-stone-800 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Hackathon Differentiator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              The Decision Arena Workflow
            </h2>
            <p className="text-sm text-stone-400 mt-1 max-w-xl">
              Compare your traditional approach side-by-side with AI alternatives. See why one strategy wins and where the trade-offs lie.
            </p>
          </div>
          <button
            onClick={onOpenArena}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-2xl text-xs font-black transition flex items-center gap-2 shadow"
          >
            <span>Launch Live Arena</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Agents Pipeline Visualizer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '1', name: 'Orchestrator', desc: 'Identifies intent & routes tasks' },
            { step: '2', name: 'Farm Data', desc: 'Queries 14d milk & water trends' },
            { step: '3', name: 'Risk & THI', desc: 'Evaluates heat & animal vitals' },
            { step: '4', name: 'Nutrition', desc: 'Compares feed library & CP/TDN' },
            { step: '5', name: 'Finance', desc: 'Calculates deterministic margins' },
            { step: '6', name: 'Decision Arena', desc: 'Ranks & explains winning plan' }
          ].map((agent, i) => (
            <div key={i} className="bg-stone-950/80 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-2">
                  {agent.step}
                </div>
                <h4 className="text-xs font-bold text-stone-200">{agent.name}</h4>
                <p className="text-[11px] text-stone-400 mt-1">{agent.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Callout */}
        <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Tested Query Case Study:</div>
            <p className="text-sm text-stone-200 font-medium italic mt-1">
              "My dairy farm's milk production has declined, feed prices have increased, and the weather is hot. I have ₹5,000 available. Compare possible actions and recommend a practical strategy."
            </p>
          </div>
          <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-300">Winning Recommended Strategy:</div>
              <div className="text-sm font-extrabold text-white">Hybrid Strategy: Smart Feed Dilution + Shading</div>
              <div className="text-xs text-stone-300 font-mono mt-0.5">Cost: ₹4,744/day • Score: 78.03/100</div>
            </div>
            <button
              onClick={onOpenArena}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold rounded-xl transition shrink-0"
            >
              Analyze Now
            </button>
          </div>
        </div>
      </section>

      {/* 5. QUICK NAVIGATION TO WORKING FEATURES */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-stone-900">Explore Application Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateTab('overview')}
            className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:border-emerald-600 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Compass className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Farm Overview</h4>
            <p className="text-xs text-stone-500 mt-1">24 cows, 410 L daily yield, active alerts & financial KPIs.</p>
          </div>

          <div
            onClick={() => onNavigateTab('arena')}
            className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:border-emerald-600 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Sparkles className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Decision Arena</h4>
            <p className="text-xs text-stone-500 mt-1">Multi-agent strategy comparison with transparent ranking.</p>
          </div>

          <div
            onClick={() => onNavigateTab('simulator')}
            className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:border-emerald-600 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Sliders className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">What-If Simulator</h4>
            <p className="text-xs text-stone-500 mt-1">Interactive substitution slider, CP%/TDN%, and margin deltas.</p>
          </div>

          <div
            onClick={() => onNavigateTab('history')}
            className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:border-emerald-600 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">Decision History & Outcomes</h4>
            <p className="text-xs text-stone-500 mt-1">Track actual field outcomes and audit past AI recommendations.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
