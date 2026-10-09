import React from 'react';
import {
  Compass,
  Sparkles,
  Sliders,
  Activity,
  History,
  Sprout,
  Home,
  CheckCircle2,
  ShieldCheck,
  X,
  Mic,
  Bell,
  Stethoscope
} from 'lucide-react';
import type { HealthResponse } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  health: HealthResponse | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenVoiceChat?: () => void;
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  health,
  isOpenMobile,
  onCloseMobile,
  onOpenVoiceChat,
  onOpenNotifications
}) => {
  const navItems = [
    { id: 'landing', label: 'Welcome & 3D Tour', icon: Home, badge: 'Home' },
    { id: 'overview', label: 'Farm Overview', icon: Compass },
    { id: 'cow-reports', label: 'Cow Health Dossier', icon: Stethoscope, badge: 'Clinical' },
    { id: 'arena', label: 'Decision Arena', icon: Sparkles, badge: 'Core AI' },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'trends', label: 'Herd Trends', icon: Activity },
    { id: 'history', label: 'Decision History', icon: History }
  ];

  const handleNav = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#062c1e] text-white flex flex-col z-50 border-r border-emerald-900/60 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Logo Header */}
        <div className="p-6 border-b border-emerald-900/50 flex items-center justify-between">
          <div
            onClick={() => handleNav('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>FarmWise</span>
                <span className="text-[10px] bg-emerald-700/60 text-emerald-200 px-1.5 py-0.5 rounded-md font-mono font-bold">
                  v1.0
                </span>
              </div>
              <div className="text-[10px] text-emerald-300/80 font-medium tracking-tight">
                Decision Intelligence Platform
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Farm Profile Pill */}
        <div className="px-5 py-4 border-b border-emerald-900/40 bg-[#042015]/60">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold mb-1">
            <span className="uppercase tracking-wider">Active Herd</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-sm font-bold text-white truncate">NammaHerd Dairy</div>
          <div className="text-xs text-emerald-200/70 truncate">Mandya, Karnataka • 24 Cows</div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider px-3 mb-2">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-bold'
                    : 'text-emerald-100/80 hover:text-white hover:bg-emerald-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-100'
                        : item.badge === 'Core AI'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-900/60 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Tools: Bilingual Voice AI & SMS Alerts */}
        <div className="px-4 py-3 space-y-2 border-t border-emerald-900/50">
          <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider px-2">
            Intelligence Tools
          </div>

          {onOpenVoiceChat && (
            <button
              onClick={() => {
                onOpenVoiceChat();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition group"
            >
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
                <span>Voice AI (ಕನ್ನಡ / EN)</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={() => {
                onOpenNotifications();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/40 hover:bg-stone-900/70 text-stone-300 hover:text-white border border-emerald-900/40 text-xs font-medium transition"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-3.5 h-3.5 text-stone-400" />
                <span>Alerts &amp; SMS</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                Active
              </span>
            </button>
          )}
        </div>

        {/* System Health & Provenance Footer Card */}
        <div className="p-4 m-4 rounded-2xl bg-[#041d13] border border-emerald-900/60 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Decision Backend
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{health?.status === 'healthy' ? 'Online' : 'Active'}</span>
            </span>
          </div>

          <div className="text-[11px] text-stone-300 leading-tight">
            Mode: <strong className="text-white">Deterministic Rule Engine</strong>
          </div>

          <div className="text-[10px] text-stone-400 leading-tight border-t border-emerald-900/50 pt-2 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>ICAR & KMF Verified Nutrition</span>
          </div>
        </div>
      </aside>
    </>
  );
};
