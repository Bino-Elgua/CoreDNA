/**
 * ENHANCED DASHBOARD
 * Improved UX with better visual hierarchy, guidance, and workflow
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ComprehensivePortfolio } from '../types-portfolio';
import { getPortfolios, getPortfolioStats, deletePortfolio } from '../services/portfolioService';
import { getAllPortfolioData, migrateOldProfiles } from '../services/dataFlowService';

const DashboardEnhanced: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<ComprehensivePortfolio[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [loaded, setLoaded] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'campaigns'>('updated');

  useEffect(() => {
    if (user) {
      const migrationCount = migrateOldProfiles();
      const allPortfolios = getAllPortfolioData();
      setPortfolios(allPortfolios);
      setLoaded(true);
      
      if (migrationCount > 0) {
        console.log(`Dashboard: Migrated ${migrationCount} portfolios from legacy format`);
      }
    }
  }, [user]);

  const handleDeletePortfolio = useCallback((portfolioId: string) => {
    console.log('[Dashboard] Attempting to delete portfolio:', portfolioId);
    const success = deletePortfolio(portfolioId);
    
    if (success) {
      const updated = getPortfolios();
      setPortfolios(updated);
    }
  }, []);

  const filteredPortfolios = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = portfolios.filter(p =>
      (p?.companyName?.toLowerCase() || '').includes(query) ||
      (p?.brandDNA?.name?.toLowerCase() || '').includes(query)
    );

    // Sort logic
    let sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
        break;
      case 'campaigns':
        sorted.sort((a, b) => b.campaigns.length - a.campaigns.length);
        break;
      case 'updated':
      default:
        sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return sorted;
  }, [portfolios, search, sortBy]);

  const totalStats = useMemo(() => ({
    portfolios: portfolios.length,
    campaigns: portfolios.reduce((sum, p) => sum + p.campaigns.length, 0),
    leads: portfolios.reduce((sum, p) => sum + p.leads.length, 0),
    assets: portfolios.reduce((sum, p) => sum + p.assets.length, 0),
  }), [portfolios]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-3xl">
          <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse">
            <span className="text-3xl">🧬</span>
          </div>
          <h1 className="text-6xl font-black text-white mb-4">CoreDNA</h1>
          <p className="text-xl text-gray-300 mb-4">Build comprehensive brand portfolios with AI-powered intelligence</p>
          <p className="text-gray-400 mb-12 text-lg">Extract brands, create campaigns, manage leads, and track assets all in one place</p>
          <button
            onClick={login}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all text-lg hover:scale-105 transform"
          >
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* HEADER */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                🧬
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">CoreDNA</h1>
            </div>
            <button
              onClick={() => navigate('/extract')}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105 transform"
            >
              + New Portfolio
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* STATS GRID - 4 column layout with better visual hierarchy */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard icon="📊" label="Portfolios" value={totalStats.portfolios} highlight={totalStats.portfolios > 0} />
          <StatCard icon="🚀" label="Campaigns" value={totalStats.campaigns} highlight={totalStats.campaigns > 0} />
          <StatCard icon="👥" label="Leads" value={totalStats.leads} highlight={totalStats.leads > 0} />
          <StatCard icon="🎨" label="Assets" value={totalStats.assets} highlight={totalStats.assets > 0} />
        </div>

        {portfolios.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* CONTROLS ROW */}
            <div className="mb-8 space-y-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search portfolios by name, industry, or brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-base"
                />
                <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex-shrink-0">
                  {['all', 'recent'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-2 rounded transition-all font-medium text-sm ${
                        activeTab === tab
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab === 'all' ? 'All' : 'Recently Updated'}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="updated">Sort by: Recently Updated</option>
                  <option value="name">Sort by: Name (A-Z)</option>
                  <option value="campaigns">Sort by: Most Active</option>
                </select>

                <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto py-2">
                  Showing {filteredPortfolios.length} of {portfolios.length}
                </div>
              </div>
            </div>

            {/* PORTFOLIOS GRID */}
            {filteredPortfolios.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {filteredPortfolios.map(portfolio => (
                  <PortfolioCard
                    key={portfolio.id}
                    portfolio={portfolio}
                    onNavigate={(path) => navigate(path)}
                    onDelete={handleDeletePortfolio}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No portfolios found matching "{search}"</p>
                <button
                  onClick={() => setSearch('')}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, highlight }) => (
  <div className={`rounded-xl p-6 border transition-all ${
    highlight
      ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-md hover:shadow-lg'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg'
  }`}>
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</div>
    <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">{value}</div>
  </div>
);

interface PortfolioCardProps {
  portfolio: ComprehensivePortfolio;
  onNavigate: (path: string) => void;
  onDelete: (portfolioId: string) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, onNavigate, onDelete }) => {
  const stats = getPortfolioStats(portfolio.id);
  const primaryColor = portfolio.brandDNA?.colors?.[0]?.hex || '#3B82F6';
  const secondaryColor = portfolio.brandDNA?.colors?.[1]?.hex || '#8B5CF6';

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => onNavigate(`/portfolio/${portfolio.id}`)}
    >
      {/* GRADIENT HEADER */}
      <div
        className="h-24 opacity-85 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      />

      {/* CONTENT */}
      <div className="p-6 flex-1 flex flex-col">
        {/* TITLE & TAGLINE */}
        <div className="mb-4 flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {portfolio.companyName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {portfolio.brandDNA?.tagline || 'No tagline'}
          </p>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4 py-4 border-y border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.campaignsCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.leadsCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Leads</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.assetsCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Assets</div>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('/campaigns');
            }}
            className="flex-1 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            New Campaign
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/portfolio/${portfolio.id}`);
            }}
            className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            View Details
          </button>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">
            {new Date(portfolio.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
              v{portfolio.dnaVersionHistory.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${portfolio.companyName}"? This cannot be undone.`)) {
                  onDelete(portfolio.id);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete portfolio"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="text-center py-24">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6">
      <span className="text-4xl">📊</span>
    </div>
    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">No portfolios yet</h3>
    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto text-lg">
      Extract your first brand to create a comprehensive portfolio with campaigns, leads, and assets.
    </p>
    <button
      onClick={() => window.location.href = '/extract'}
      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105 transform"
    >
      Extract Your First Brand
    </button>
  </div>
);

export default DashboardEnhanced;
