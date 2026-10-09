import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DecisionArenaView } from './components/DecisionArenaView';
import { SimulatorView } from './components/SimulatorView';
import { HerdTrendsView } from './components/HerdTrendsView';
import { DecisionHistoryView } from './components/DecisionHistoryView';
import { ResponsibleAIFooter } from './components/ResponsibleAIFooter';
import { api } from './services/api';
import type { DashboardData, HealthResponse } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Connection Error Banner if backend is not reachable */}
        {error && (
          <div className="mb-6 p-4 bg-rose-950/50 border border-rose-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <p className="font-semibold text-rose-200">Backend Connection Notice</p>
                <p>{error}</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold rounded-xl border border-rose-700/60 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Tab Routing */}
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
  );
}

export default App;
