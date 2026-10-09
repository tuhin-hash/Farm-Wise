import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { DecisionArenaView } from './components/DecisionArenaView';
import { SimulatorView } from './components/SimulatorView';
import { HerdTrendsView } from './components/HerdTrendsView';
import { DecisionHistoryView } from './components/DecisionHistoryView';
import { ResponsibleAIFooter } from './components/ResponsibleAIFooter';
import { VoiceChatModal } from './components/VoiceChatModal';
import { api } from './services/api';
import type { DashboardData, HealthResponse } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [h, d] = await Promise.all([
        api.getHealth().catch(err => {
          console.warn('Backend health check failed:', err);
          return null;
        }),
        api.getDashboard().catch(err => {
          console.warn('Dashboard fetch failed:', err);
          return null;
        })
      ]);

      if (h) setHealth(h);
      if (d) setDashboard(d);

      if (!h && !d) {
        setError('Could not connect to FarmWise backend at http://localhost:8000. Ensure the FastAPI server is running.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading farm data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9f6] text-stone-900 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Deep Forest-Green Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        health={health}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (Offset by Sidebar on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigateTab={setActiveTab}
          dashboard={dashboard}
          health={health}
          onRefreshData={loadData}
          isLoading={isLoading}
          onOpenVoiceChat={() => setIsVoiceChatOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Backend Notice Banner if disconnected */}
          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 text-amber-900 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-950">Backend Connectivity Notice</p>
                  <p>{error} Running in local synthetic preview mode.</p>
                </div>
              </div>
              <button
                onClick={loadData}
                className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 flex items-center gap-1.5 transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
              </button>
            </div>
          )}

          {/* Active Tab Routing */}
          {activeTab === 'landing' && (
            <LandingPage
              onExplore={() => setActiveTab('overview')}
              onOpenArena={() => setActiveTab('arena')}
              onNavigateTab={setActiveTab}
              health={health}
            />
          )}

          {activeTab === 'overview' && (
            <DashboardView
              data={dashboard}
              onNavigateToArena={() => setActiveTab('arena')}
              onNavigateSimulator={() => setActiveTab('simulator')}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'arena' && (
            <DecisionArenaView
              onDecisionSaved={() => setActiveTab('history')}
              onNavigateHistory={() => setActiveTab('history')}
              onNavigateSimulator={() => setActiveTab('simulator')}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              onNavigateArena={() => setActiveTab('arena')}
            />
          )}

          {activeTab === 'trends' && (
            <HerdTrendsView
              dashboard={dashboard}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'history' && (
            <DecisionHistoryView />
          )}

          {/* Responsible AI Footer */}
          <ResponsibleAIFooter />
        </main>
      </div>

      {/* Multilingual Farmer Voice AI Assistant Modal */}
      <VoiceChatModal
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
        onNavigateTab={setActiveTab}
        dashboardData={dashboard}
      />
    </div>
  );
}

export default App;
