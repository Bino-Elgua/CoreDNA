import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ToastContainer from './components/ToastContainer';
import { ApiKeyPrompt } from './components/ApiKeyPrompt';
import Layout from './components/Layout';
import { SonicOrb } from './components/SonicOrb';
import HealthCheckDisplay from './components/HealthCheckDisplay';
import { errorHandler } from './services/errorHandlingService';
import { authService } from './services/authService';
import { hybridStorage } from './services/hybridStorageService';
// import { migrateLegacyKeys } from './services/settingsService'; // Function doesn't exist

// Lazy load pages - importing from root pages/ directory
const ExtractPage = React.lazy(() => import('./pages/ExtractPage'));
const DashboardPageV2 = React.lazy(() => import('./pages/DashboardPageV2'));
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage'));
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
const ImageDebugPage = React.lazy(() => import('./pages/ImageDebugPage'));

// Loading fallback
const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
    <div className="text-center">
      <div className="text-5xl mb-4 animate-bounce">🧬</div>
      <p className="text-white text-lg">Loading...</p>
      <p className="text-white text-xs mt-4 opacity-75">This may take a moment</p>
    </div>
  </div>
);

// Error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string; errorStack?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '', errorStack: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message, errorStack: error.stack };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error);
    console.error('Error Info:', errorInfo);
    // Log to localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('_app_errors') || '[]');
      errors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
      localStorage.setItem('_app_errors', JSON.stringify(errors.slice(-10)));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-red-700 dark:text-red-300 mb-4">{this.state.error}</p>
            {this.state.errorStack && (
              <details className="text-xs text-red-600 dark:text-red-400 text-left mb-4 max-h-48 overflow-auto">
                <summary>Stack trace</summary>
                <pre className="whitespace-pre-wrap break-words">{this.state.errorStack}</pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  console.log('[App] Rendering...');
  const [darkMode, setDarkMode] = useState(true);
  const [showApiPrompt, setShowApiPrompt] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);

  useEffect(() => {
    try {
      // STEP 0: Initialize services
      console.log('[App] Initializing services...');
      
      // Subscribe to errors for UI notifications
      errorHandler.onError((error) => {
        console.log('[App] Error occurred:', error);
        // Toast notifications would go here
      });

      // STEP 1: Check storage quota WITHOUT clearing data
      try {
        localStorage.setItem('_quota_test', 'test');
        localStorage.removeItem('_quota_test');
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          errorHandler.logQuotaError('localStorage quota exceeded');
          const dismissed = localStorage.getItem('_quotaWarningDismissed');
          if (!dismissed) {
            setShowQuotaWarning(true);
          }
          return; // Stop initialization
        }
      }

      // STEP 2: Setup auth (get current user)
      const user = authService.getCurrentUser();
      console.log('[App] Current user:', user);

      // STEP 3: Setup hybrid storage
      const syncStatus = hybridStorage.getSyncStatus();
      console.log('[App] Sync status:', syncStatus);

      // Subscribe to auth changes
      authService.onAuthChange((user) => {
        console.log('[App] Auth state changed:', user);
      });

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
          errorHandler.logError('SETTINGS_PARSE_ERROR', 'Error parsing settings', 'warning');
          if (!dismissed) setShowApiPrompt(true);
        }
      } else if (!dismissed) {
        setShowApiPrompt(true);
      }
    } catch (e) {
      errorHandler.handleUncaughtError(e);
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
        {/* Quota Warning Modal */}
        {showQuotaWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md shadow-xl border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Storage Full</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your browser storage is nearly full ({Math.round((localStorage.length / 5242880) * 100)}%). 
                Archive or delete old portfolios to continue saving new data.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowQuotaWarning(false);
                    localStorage.setItem('_quotaWarningDismissed', 'true');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowQuotaWarning(false);
                    window.location.href = '/#/dashboard';
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

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
                      <Route path="/" element={<DashboardPageV2 />} />
                      <Route path="/dashboard" element={<DashboardPageV2 />} />
                      <Route path="/portfolio/:portfolioId" element={<PortfolioPage />} />
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
                      <Route path="/debug-image" element={<ImageDebugPage />} />
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
