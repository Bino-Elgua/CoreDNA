import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import DashboardEnhanced from './pages/DashboardEnhanced';
import PortfolioPage from './pages/PortfolioPage';
import ExtractPage from './pages/ExtractPage';
import CampaignsPage from './pages/CampaignsPage';

const AppMinimal: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <Router>
        <Layout darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          <Routes>
            <Route path="/" element={<DashboardEnhanced />} />
            <Route path="/dashboard" element={<DashboardEnhanced />} />
            <Route path="/portfolio/:portfolioId" element={<PortfolioPage />} />
            <Route path="/extract" element={<ExtractPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default AppMinimal;
