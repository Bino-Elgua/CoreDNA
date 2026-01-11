import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, GlobalSettings } from '../types';
import { siteDeploymentService, DeploymentProgress } from '../services/siteDeploymentService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DEPLOYMENT_STEPS = [
  { id: 1, label: 'Analyzing DNA', icon: '🧬' },
  { id: 2, label: 'Generating website', icon: '⚙️' },
  { id: 3, label: 'Creating GitHub repo', icon: '🐙' },
  { id: 4, label: 'Deploying to Vercel', icon: '▲' },
  { id: 5, label: 'Going live', icon: '🌐' },
];

interface DeploymentState {
  isDeploying: boolean;
  currentStep: number;
  progress: number;
  statusMessage: string;
  repoUrl: string | null;
  deploymentUrl: string | null;
  error: string | null;
}

const SiteBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<BrandDNA[]>([]);
  const [selectedDnaId, setSelectedDnaId] = useState('');
  const [settings, setSettings] = useState<GlobalSettings | null>(null);

  const [deployment, setDeployment] = useState<DeploymentState>({
    isDeploying: false,
    currentStep: 0,
    progress: 0,
    statusMessage: '',
    repoUrl: null,
    deploymentUrl: null,
    error: null,
  });

  const [credentials, setCredentials] = useState({
    githubToken: localStorage.getItem('github_token') || '',
    githubOwner: localStorage.getItem('github_owner') || '',
    vercelToken: localStorage.getItem('vercel_token') || '',
    companyName: ''
  });

  const [showCredentials, setShowCredentials] = useState(false);
  const [deployedSites, setDeployedSites] = useState<any[]>([]);

  // Load profiles and settings
  useEffect(() => {
    const stored = localStorage.getItem('core_dna_profiles');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfiles(parsed);
        if (parsed.length > 0) setSelectedDnaId(parsed[0].id);
      } catch (e) {}
    }

    const storedSettings = localStorage.getItem('core_dna_settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {}
    }

    const storedSites = localStorage.getItem('deployed_sites_github_vercel');
    if (storedSites) {
      try {
        setDeployedSites(JSON.parse(storedSites));
      } catch (e) {}
    }
  }, [user]);

  const selectedDna = profiles.find(p => p.id === selectedDnaId);

  const handleSaveCredentials = () => {
    if (!credentials.githubToken || !credentials.vercelToken || !credentials.githubOwner) {
      alert('Please fill in all credentials');
      return;
    }

    localStorage.setItem('github_token', credentials.githubToken);
    localStorage.setItem('github_owner', credentials.githubOwner);
    localStorage.setItem('vercel_token', credentials.vercelToken);
    setShowCredentials(false);
  };

  const handleDeploy = async () => {
    if (!selectedDna || !credentials.githubToken || !credentials.vercelToken) {
      setDeployment(prev => ({
        ...prev,
        error: 'Missing brand profile or credentials. Please set up your GitHub and Vercel tokens in Settings.'
      }));
      return;
    }

    setDeployment({
      isDeploying: true,
      currentStep: 1,
      progress: 0,
      statusMessage: 'Starting deployment...',
      repoUrl: null,
      deploymentUrl: null,
      error: null,
    });

    // Subscribe to progress
    siteDeploymentService.onProgress((progress: DeploymentProgress) => {
      const stepMap: Record<string, number> = {
        generating: 2,
        github: 3,
        vercel: 4,
        complete: 5
      };

      setDeployment(prev => ({
        ...prev,
        currentStep: stepMap[progress.stage] || prev.currentStep,
        progress: progress.progress,
        statusMessage: progress.message,
        repoUrl: progress.data?.repoUrl || prev.repoUrl,
        deploymentUrl: progress.data?.deploymentUrl || prev.deploymentUrl,
        error: progress.stage === 'error' ? progress.message : null
      }));
    });

    try {
      const result = await siteDeploymentService.deploy({
        companyName: credentials.companyName || selectedDna.name,
        portfolio: selectedDna,
        githubToken: credentials.githubToken,
        githubOwner: credentials.githubOwner,
        vercelToken: credentials.vercelToken,
        useLocalGeneration: true // For now, use local generation
      });

      // Save deployed site
      const newSite = {
        id: `site_${Date.now()}`,
        name: credentials.companyName || selectedDna.name,
        dnaId: selectedDnaId,
        repoUrl: result.repoUrl,
        deploymentUrl: result.deploymentUrl,
        createdAt: new Date().toISOString()
      };

      const updated = [...deployedSites, newSite];
      setDeployedSites(updated);
      localStorage.setItem('deployed_sites_github_vercel', JSON.stringify(updated));

      setDeployment(prev => ({
        ...prev,
        isDeploying: false,
        currentStep: 5,
        progress: 100,
        statusMessage: '✓ Deployment complete!'
      }));
    } catch (error) {
      setDeployment(prev => ({
        ...prev,
        isDeploying: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary mb-6"
      >
        ← Back
      </button>

      <h1 className="text-4xl font-bold mb-2">Site Builder</h1>
      <p className="text-gray-500 mb-8">Generate and deploy websites powered by brand DNA to GitHub & Vercel</p>

      {/* Credentials Setup */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Credentials</h2>
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="px-4 py-2 bg-dna-primary text-white rounded-lg hover:opacity-90"
          >
            {showCredentials ? 'Hide' : 'Setup'}
          </button>
        </div>

        {showCredentials && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">GitHub Token</label>
              <input
                type="password"
                value={credentials.githubToken}
                onChange={(e) => setCredentials(prev => ({ ...prev, githubToken: e.target.value }))}
                placeholder="ghp_..."
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get from <a href="https://github.com/settings/tokens" target="_blank" className="text-blue-500">GitHub Settings</a> (needs: repo, workflow)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">GitHub Owner</label>
              <input
                type="text"
                value={credentials.githubOwner}
                onChange={(e) => setCredentials(prev => ({ ...prev, githubOwner: e.target.value }))}
                placeholder="your-github-username"
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Vercel Token</label>
              <input
                type="password"
                value={credentials.vercelToken}
                onChange={(e) => setCredentials(prev => ({ ...prev, vercelToken: e.target.value }))}
                placeholder="vercel_..."
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get from <a href="https://vercel.com/account/tokens" target="_blank" className="text-blue-500">Vercel Account</a>
              </p>
            </div>

            <button
              onClick={handleSaveCredentials}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Save Credentials
            </button>
          </div>
        )}

        {!showCredentials && credentials.githubToken && (
          <p className="text-green-600 text-sm">✓ Credentials configured</p>
        )}
      </div>

      {/* Brand DNA Selection */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4">Select Brand DNA</h2>
        <select
          value={selectedDnaId}
          onChange={(e) => setSelectedDnaId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 text-lg font-semibold"
        >
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedDna && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p><strong>Tagline:</strong> {selectedDna.tagline}</p>
            <p className="mt-2"><strong>Description:</strong> {selectedDna.description}</p>
          </div>
        )}
      </div>

      {/* Company Name Input */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4">Company Name</h2>
        <input
          type="text"
          value={credentials.companyName}
          onChange={(e) => setCredentials(prev => ({ ...prev, companyName: e.target.value }))}
          placeholder={selectedDna?.name || 'Company name'}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 text-lg"
        />
        <p className="text-xs text-gray-500 mt-2">This will be used for your GitHub repo and Vercel project name</p>
      </div>

      {/* Deployment Progress */}
      {deployment.isDeploying && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6">Deployment Progress</h2>
          
          <div className="space-y-4">
            {DEPLOYMENT_STEPS.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  idx < deployment.currentStep - 1
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : idx === deployment.currentStep - 1
                    ? 'bg-blue-100 dark:bg-blue-900/20'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <div className="text-2xl">{step.icon}</div>
                <div className="flex-grow">
                  <p className="font-semibold">{step.label}</p>
                  {idx === deployment.currentStep - 1 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{deployment.statusMessage}</p>
                  )}
                </div>
                {idx < deployment.currentStep - 1 && <span className="text-green-600 text-xl">✓</span>}
                {idx === deployment.currentStep - 1 && (
                  <div className="animate-spin text-blue-600">⟳</div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${deployment.progress}%` }}
              className="h-full bg-gradient-to-r from-dna-primary to-dna-secondary"
            />
          </div>
          <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{deployment.progress}%</p>
        </div>
      )}

      {/* Deployment Result */}
      {!deployment.isDeploying && (deployment.deploymentUrl || deployment.error) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-8 mb-8 border ${
            deployment.error
              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'
          }`}
        >
          <h3 className={`text-xl font-bold mb-4 ${deployment.error ? 'text-red-600' : 'text-green-600'}`}>
            {deployment.error ? '❌ Deployment Failed' : '✓ Deployment Successful!'}
          </h3>

          {deployment.error && (
            <p className="text-red-700 dark:text-red-300">{deployment.error}</p>
          )}

          {deployment.repoUrl && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">GitHub Repository:</p>
                <a href={deployment.repoUrl} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                  {deployment.repoUrl}
                </a>
              </div>

              {deployment.deploymentUrl && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Live Website:</p>
                  <a href={deployment.deploymentUrl} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                    {deployment.deploymentUrl}
                  </a>
                </div>
              )}

              <button
                onClick={() => window.open(deployment.deploymentUrl, '_blank')}
                className="mt-4 px-6 py-2 bg-dna-primary text-white rounded-lg hover:opacity-90"
              >
                Visit Live Site →
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Deploy Button */}
      {!deployment.isDeploying && (
        <button
          onClick={handleDeploy}
          disabled={!selectedDna || !credentials.githubToken || !credentials.vercelToken}
          className="w-full py-3 bg-gradient-to-r from-dna-primary to-dna-secondary text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          🚀 Deploy Website
        </button>
      )}

      {/* Deployed Sites History */}
      {deployedSites.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Deployment History</h2>
          <div className="grid gap-4">
            {deployedSites.map(site => (
              <div key={site.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-lg mb-2">{site.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {new Date(site.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-3">
                  <a href={site.repoUrl} target="_blank" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:opacity-90">
                    GitHub Repo →
                  </a>
                  <a href={site.deploymentUrl} target="_blank" className="px-4 py-2 bg-dna-primary text-white rounded-lg text-sm hover:opacity-90">
                    Visit Site →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteBuilderPage;
