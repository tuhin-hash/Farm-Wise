import React, { useState } from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Mic
} from 'lucide-react';
import type { DashboardData, HealthResponse } from '../types';

interface HeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onNavigateTab: (tab: string) => void;
  dashboard: DashboardData | null;
  health: HealthResponse | null;
  onRefreshData: () => void;
  isLoading: boolean;
  onOpenVoiceChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onNavigateTab,
  dashboard,
  health: _health,
  onRefreshData,
  isLoading,
  onOpenVoiceChat
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'landing':
        return { title: 'Welcome & 3D Interactive Tour', desc: 'Decision intelligence platform overview' };
      case 'overview':
        return { title: 'Farm Overview & Operations', desc: 'Real-time telemetry, milk yield, and herd status' };
      case 'arena':
        return { title: 'Decision Arena', desc: 'Multi-agent comparative strategy evaluation' };
      case 'simulator':
        return { title: 'What-If Scenario Simulator', desc: 'Deterministic feed substitution and margin modeling' };
      case 'trends':
        return { title: 'Herd Analytics & Longitudinal Trends', desc: '14-day production, water, and thermal stress correlation' };
      case 'history':
        return { title: 'Decision History & Field Outcomes', desc: 'SQLite audit log of past analyses and recorded results' };
      default:
        return { title: 'FarmWise Decision Intelligence', desc: 'Evidence-based livestock management' };
    }
  };

  const { title, desc } = getTabTitle();
  const alertCount = dashboard?.active_alerts?.length || 2;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-tight">
              {title}
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
              Mandya Herd
            </span>
          </div>
          <p className="text-[11px] text-stone-500 hidden sm:block leading-none mt-0.5">{desc}</p>
        </div>
      </div>

      {/* Right: Quick Actions & Alerts */}
      <div className="flex items-center gap-2.5">
        {/* Voice AI Assistant Button */}
        {onOpenVoiceChat && (
          <button
            onClick={onOpenVoiceChat}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
            title="Open Multilingual Farmer Voice Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
            <span className="hidden sm:inline">Voice AI (ಕನ್ನಡ / EN)</span>
            <span className="sm:hidden">Voice</span>
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Refresh Data"
          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition border border-transparent hover:border-stone-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* Active Alerts Bell with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition relative border border-transparent hover:border-stone-200"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Alerts Dropdown Modal */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-stone-200 shadow-xl p-4 z-40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-800">Active Herd Alerts ({alertCount})</span>
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 text-xs">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cow KA-MAN-104 High Fever (39.9°C)</span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 mt-1">
                    Rectal temperature 39.9°C with resting tachycardia (105 BPM) and tachypnea. Immediate veterinary triage recommended.
                  </p>
                </div>

                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100 text-xs">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Moderate-to-Severe THI (86.8)</span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 mt-1">
                    Ambient heat load has triggered a 35 L/day milk production decline over 72 hours.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAlertsDropdown(false);
                  onNavigateTab('arena');
                }}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition text-center shadow-xs"
              >
                Launch Decision Arena for Solutions
              </button>
            </div>
          )}
        </div>

        {/* Quick Launch Button to Arena */}
        {activeTab !== 'arena' && (
          <button
            onClick={() => onNavigateTab('arena')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Decision Arena</span>
            <span className="sm:hidden">Arena</span>
          </button>
        )}
      </div>
    </header>
  );
};
