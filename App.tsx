
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ExtractPage from './pages/ExtractPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import BrandSimulatorPage from './pages/BrandSimulatorPage';
import AgentForgePage from './pages/AgentForgePage';
import SettingsPage from './pages/SettingsPage';
import BattleModePage from './pages/BattleModePage';
import SonicLabPage from './pages/SonicLabPage';
import LiveSessionPage from './pages/LiveSessionPage';
import SharedProfilePage from './pages/SharedProfilePage';
import SiteBuilderPage from './pages/SiteBuilderPage';
import SchedulerPage from './pages/SchedulerPage';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <AuthProvider>
      <Router>
        <Routes>
            {/* Shared Route - No Layout Wrappers */}
            <Route path="/share/:id" element={<SharedProfilePage />} />
            
            {/* Main App Routes */}
            <Route path="*" element={
                <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                  <Routes>
                    {/* Home is now Dashboard */}
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
                    <Route path="/battle" element={<BattleModePage />} />
                    <Route path="/sonic" element={<SonicLabPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
            } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
