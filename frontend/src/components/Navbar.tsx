import React from 'react';
import { Sprout, Compass, Activity, Sliders, History, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import type { HealthResponse } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, health }) => {
  const navItems = [
    { id: 'overview', label: 'Farm Overview', icon: Compass },
    { id: 'arena', label: 'Decision Arena', icon: Sparkles, badge: 'Core' },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'trends', label: 'Herd Trends', icon: Activity },
    { id: 'history', label: 'Decision History', icon: History }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                FarmWise
              </div>
              <div className="text-[11px] text-emerald-400 font-medium tracking-wide hidden sm:block">
                Your experience. More evidence. Better farm decisions.
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="hidden md:inline-block px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] rounded font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Backend Status indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
            {health?.status === 'healthy' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium">Backend:</span>
                <span className="text-emerald-400 font-semibold">
                  {health.llm_enabled ? 'Live LLM' : 'Rule-Based Demo Mode'}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-400 font-medium">Connecting Backend...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
