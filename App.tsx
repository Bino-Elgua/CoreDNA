import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from './components/ToastContainer';
import { ApiKeyPrompt } from './components/ApiKeyPrompt';
import Layout from './components/Layout';
import { SonicOrb } from './components/SonicOrb';
import HealthCheckDisplay from './components/HealthCheckDisplay';
import { migrateLegacyKeys } from './src/services/settingsService';

// Lazy load pages - importing from root pages/ directory
const ExtractPage = React.lazy(() => import('./pages/ExtractPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CampaignsPage = React.lazy(() => import('./pages/CampaignsPage'));
const BrandSimulatorPage = React.lazy(() => import('./pages/BrandSimulatorPage'));
const AgentForgePage = React.lazy(() => import('./pages/AgentForgePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const AffiliateHubPage = React.lazy(() => import('./pages/AffiliateHubPage'));
const BattleModePage = React.lazy(() => import('./pages/BattleModePage'));
const SonicLabPage = React.lazy(() => import('./pages/SonicLabPage'));
const LiveSessionPage = React.lazy(() => import('./pages/LiveSessionPage'));
const SharedProfilePage = React.lazy(() => import('./pages/SharedProfilePage'));
const SiteBuilderPage = React.lazy(() => import('./pages/SiteBuilderPage'));
const SchedulerPage = React.lazy(() => import('./pages/SchedulerPage'));
const AutomationsPage = React.lazy(() => import('./pages/AutomationsPage'));

// Loading fallback
const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
    <div className="text-center">
      <div className="text-5xl mb-4 animate-bounce">🧬</div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-red-700 dark:text-red-300 mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [showApiPrompt, setShowApiPrompt] = useState(false);

  useEffect(() => {
    try {
      // STEP 0: Auto-clear localStorage if quota exceeded
      try {
        localStorage.setItem('_quota_test', 'test');
        localStorage.removeItem('_quota_test');
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old data...');
          // Keep only settings, clear everything else
          const settings = localStorage.getItem('core_dna_settings');
          localStorage.clear();
          if (settings) {
            localStorage.setItem('core_dna_settings', settings);
          }
        }
      }

      // STEP 1: Migrate legacy API keys on app load (one-time)
      migrateLegacyKeys();

      const settings = localStorage.getItem('core_dna_settings');
      const dismissed = localStorage.getItem('apiPromptDismissed');

      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          // Check if any provider has an API key configured
          const hasLLMKey = parsed.llms && Object.values(parsed.llms).some((config: any) => config?.apiKey?.trim());
          const hasImageKey = parsed.image && Object.values(parsed.image).some((config: any) => config?.apiKey?.trim());
          
          // Only show prompt if NO keys configured AND not dismissed
          if (!hasLLMKey && !hasImageKey && !dismissed) {
            setShowApiPrompt(true);
          }
        } catch (e) {
          console.error('Error parsing settings:', e);
          if (!dismissed) setShowApiPrompt(true);
        }
      } else if (!dismissed) {
        setShowApiPrompt(true);
      }
    } catch (e) {
      console.error('Error checking API keys:', e);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleApiPromptComplete = () => {
    localStorage.setItem('apiPromptDismissed', 'true');
    setShowApiPrompt(false);
  };

  return (
    <ErrorBoundary>
      <>
        {showApiPrompt && <ApiKeyPrompt onComplete={handleApiPromptComplete} />}
        <AuthProvider>
          <Router>
            <ToastContainer />
            {/* Health Check Display - Mobile friendly error/status indicator */}
            <HealthCheckDisplay />
            {/* Sonic Co-Pilot Orb (Hunter+ tiers only) */}
            <SonicOrb />
            <Routes>
              <Route path="/share/:id" element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <SharedProfilePage />
                </React.Suspense>
              } />
              
              <Route path="*" element={
                <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <React.Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/extract" element={<ExtractPage />} />
                      <Route path="/campaigns" element={<CampaignsPage />} />
                      <Route path="/simulate" element={<BrandSimulatorPage />} />
                      <Route path="/live" element={<LiveSessionPage />} />
                      <Route path="/agent-forge" element={<AgentForgePage />} />
                      <Route path="/builder" element={<SiteBuilderPage />} />
                      <Route path="/scheduler" element={<SchedulerPage />} />
                       <Route path="/settings" element={<SettingsPage />} />
                       <Route path="/affiliate" element={<AffiliateHubPage />} />
                       <Route path="/battle" element={<BattleModePage />} />
                       <Route path="/sonic" element={<SonicLabPage />} />
                       <Route path="/automations" element={<AutomationsPage />} />
                       <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </React.Suspense>
                </Layout>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </>
    </ErrorBoundary>
  );
};

export default App;
