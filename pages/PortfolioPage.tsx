/**
 * MODERN PORTFOLIO PAGE
 * Clean, fast, comprehensive portfolio management
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ComprehensivePortfolio } from '../types-portfolio';
import { getPortfolio, getPortfolioActivityFeed, getPortfolioStats, deletePortfolio, exportPortfolio } from '../services/portfolioService';

const PortfolioPage: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<ComprehensivePortfolio | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dna' | 'campaigns' | 'leads'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (portfolioId) {
      const data = getPortfolio(portfolioId);
      setPortfolio(data);
      setLoading(false);
    }
  }, [portfolioId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-flex animate-spin w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Portfolio not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const stats = getPortfolioStats(portfolioId!);
  const activityFeed = getPortfolioActivityFeed(portfolioId!, 10);
  const primaryColor = portfolio.brandDNA?.colors?.[0]?.hex || '#3B82F6';

  const handleExport = () => {
    const data = exportPortfolio(portfolioId!);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${portfolio.companyName}-portfolio.json`;
      a.click();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure? This cannot be undone.')) {
      deletePortfolio(portfolioId!);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* HEADER WITH COLOR */}
      <div
        className="h-40 relative"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${portfolio.brandDNA?.colors?.[1]?.hex || '#8B5CF6'})` }}
      >
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10 mb-12">
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:shadow-lg transition-all"
        >
          ← Back
        </button>

        {/* PORTFOLIO HEADER CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-start gap-6 mb-6">
            {portfolio.brandDNA?.colors?.[0] && (
              <div
                className="w-20 h-20 rounded-xl shadow-lg flex-shrink-0"
                style={{ backgroundColor: portfolio.brandDNA.colors[0].hex }}
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{portfolio.companyName}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">{portfolio.brandDNA?.tagline}</p>
              {portfolio.industry && <p className="text-gray-500 dark:text-gray-500 text-sm">📍 {portfolio.industry}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 font-medium"
              >
                📥 Export
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium"
              >
                🗑 Delete
              </button>
            </div>
          </div>

          {/* STATS */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatItem label="Campaigns" value={stats.campaignsCount} color="blue" />
              <StatItem label="Assets" value={stats.assetsCount} color="green" />
              <StatItem label="Leads" value={stats.leadsCount} color="purple" />
              <StatItem label="Integrations" value={stats.integrationsCount} color="orange" />
              <StatItem label="Versions" value={stats.dnaVersions} color="pink" />
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {['overview', 'dna', 'campaigns', 'leads'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'dna' ? 'Brand DNA' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{portfolio.brandDNA.description}</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Mission</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{portfolio.brandDNA.mission}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Values</h3>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.brandDNA.values?.slice(0, 3).map(v => (
                        <span key={v} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIVITY FEED */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {activityFeed.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/campaigns')}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                  >
                    + New Campaign
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm">
                    + Add Leads
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Portfolio Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs uppercase font-medium">Created</p>
                    <p className="text-gray-900 dark:text-white font-medium">{new Date(portfolio.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs uppercase font-medium">Last Updated</p>
                    <p className="text-gray-900 dark:text-white font-medium">{new Date(portfolio.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dna' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Brand Colors</h3>
              <div className="space-y-4">
                {portfolio.brandDNA.colors?.map(color => (
                  <div key={color.hex} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg shadow" style={{ backgroundColor: color.hex }} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{color.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{color.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Brand Fonts</h3>
              <div className="space-y-4">
                {portfolio.brandDNA.fonts?.map(font => (
                  <div key={font.family} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: font.family }}>
                      {font.family}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{font.usage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tone of Voice</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{portfolio.brandDNA.toneOfVoice.description}</p>
              <div className="flex flex-wrap gap-2">
                {portfolio.brandDNA.toneOfVoice.adjectives?.slice(0, 5).map(adj => (
                  <span key={adj} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                    {adj}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Visual Style</h3>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">{portfolio.brandDNA.visualStyle.style}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{portfolio.brandDNA.visualStyle.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            {portfolio.campaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No campaigns yet</p>
                <button
                  onClick={() => navigate('/campaigns')}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.campaigns.map(campaign => (
                  <div key={campaign.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{campaign.goal}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {campaign.assets?.length || 0} assets • {new Date(campaign.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {portfolio.leads.length === 0 ? (
              <div className="text-center py-12 px-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No leads yet</p>
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  Add Leads
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Name</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Company</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Email</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {portfolio.leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="py-3 px-6 text-gray-900 dark:text-white">{lead.name}</td>
                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400">{lead.company}</td>
                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400 text-sm">{lead.email}</td>
                        <td className="py-3 px-6">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  };

  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
};

export default PortfolioPage;
