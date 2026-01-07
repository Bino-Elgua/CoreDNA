
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, GlobalSettings } from '../types';
import { siteGeneratorService, GeneratedSite } from '../services/siteGeneratorService';
import { firebaseDeploymentService, DeploymentResult } from '../services/firebaseDeploymentService';
import { useNavigate } from 'react-router-dom';

const DEPLOYMENT_STEPS = [
    { id: 1, label: 'Analyzing DNA', icon: '🧬' },
    { id: 2, label: 'Generating structure & copy', icon: '📝' },
    { id: 3, label: 'Creating visuals', icon: '🎨' },
    { id: 4, label: 'Building pages', icon: '🏗️' },
    { id: 5, label: 'Embedding Sonic Agent', icon: '🎤' },
    { id: 6, label: 'Deploying to Firebase Hosting', icon: '🚀' },
];

interface DeploymentState {
    isDeploying: boolean;
    currentStep: number;
    progress: number;
    statusMessage: string;
    generatedSite: GeneratedSite | null;
    deploymentResult: DeploymentResult | null;
    error: string | null;
}

const SiteBuilderPage: React.FC = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<BrandDNA[]>([]);
    const [selectedDnaId, setSelectedDnaId] = useState('');
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    const [deployment, setDeployment] = useState<DeploymentState>({
        isDeploying: false,
        currentStep: 0,
        progress: 0,
        statusMessage: '',
        generatedSite: null,
        deploymentResult: null,
        error: null,
    });

    const [deployedSites, setDeployedSites] = useState<GeneratedSite[]>([]);

    // Load DNA profiles and settings
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

        const storedSites = localStorage.getItem('core_dna_deployed_sites');
        if (storedSites) {
            try {
                setDeployedSites(JSON.parse(storedSites));
            } catch (e) {}
        }
    }, []);

    const selectedDna = profiles.find(p => p.id === selectedDnaId);

    const handleBuildAndDeploy = async () => {
        if (!selectedDna || !settings) {
            setDeployment(prev => ({ ...prev, error: 'Missing brand profile or settings' }));
            return;
        }

        setDeployment({
            isDeploying: true,
            currentStep: 1,
            progress: 10,
            statusMessage: DEPLOYMENT_STEPS[0].label,
            generatedSite: null,
            deploymentResult: null,
            error: null,
        });

        try {
            // Step 1-5: Generate site
            const generatedSite = await siteGeneratorService.generateSite(
                selectedDna,
                undefined,
                settings,
                (step, progress) => {
                    const stepIndex = DEPLOYMENT_STEPS.findIndex(s => s.label === step);
                    setDeployment(prev => ({
                        ...prev,
                        currentStep: stepIndex + 1,
                        progress: 10 + (progress * 0.5),
                        statusMessage: step,
                    }));
                }
            );

            setDeployment(prev => ({
                ...prev,
                generatedSite,
                currentStep: 6,
                progress: 60,
                statusMessage: 'Deploying to Firebase Hosting...',
            }));

            // Step 6: Deploy to Firebase
            const deployConfig = {
                firebaseProjectId: settings?.whiteLabel?.agencyName || 'coredna-default',
                firebaseApiKey: localStorage.getItem('firebase_api_key') || '',
                firebaseStorageBucket: localStorage.getItem('firebase_storage_bucket') || '',
            };

            const result = await firebaseDeploymentService.deploySite(
                generatedSite,
                deployConfig,
                (message, progress) => {
                    setDeployment(prev => ({
                        ...prev,
                        progress: 60 + (progress * 0.4),
                        statusMessage: message,
                    }));
                }
            );

            // Success
            const updatedSites = [...deployedSites, generatedSite];
            setDeployedSites(updatedSites);
            localStorage.setItem('core_dna_deployed_sites', JSON.stringify(updatedSites));

            setDeployment(prev => ({
                ...prev,
                isDeploying: false,
                currentStep: 6,
                progress: 100,
                statusMessage: 'Site live — chat active!',
                deploymentResult: result,
            }));
        } catch (e: any) {
            console.error('Deployment error:', e);
            setDeployment(prev => ({
                ...prev,
                isDeploying: false,
                error: e.message || 'Deployment failed',
            }));
        }
    };

    const handleOpenSite = (site: GeneratedSite) => {
        // Open the deployed site URL
        window.open(deployment.deploymentResult?.siteUrl || `https://${site.id}.coredna.app`, '_blank');
    };

    const handleCopyLink = (site: GeneratedSite) => {
        const url = deployment.deploymentResult?.siteUrl || `https://${site.id}.coredna.app`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                        ← Back
                    </button>
                    <h1 className="text-5xl font-bold text-white mb-2">Site Builder</h1>
                    <p className="text-xl text-gray-400">One-click professional websites from your BrandDNA</p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Controls */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 sticky top-24">
                            {/* Brand Selector */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-3">Select Brand</label>
                                <select 
                                    value={selectedDnaId}
                                    onChange={(e) => setSelectedDnaId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Info Card */}
                            {selectedDna && (
                                <div className="mb-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                    <h3 className="font-bold text-white mb-2">{selectedDna.name}</h3>
                                    <p className="text-sm text-gray-300 mb-3">{selectedDna.mission}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedDna.colors.slice(0, 3).map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-8 h-8 rounded-lg border border-gray-600 shadow-lg"
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Build Button */}
                            <button 
                                onClick={handleBuildAndDeploy}
                                disabled={deployment.isDeploying || !selectedDna}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold shadow-lg hover:shadow-blue-500/50 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deployment.isDeploying ? (
                                    <>
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        Building & Deploying...
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        Build & Deploy Site
                                    </>
                                )}
                            </button>

                            {/* Error Message */}
                            {deployment.error && (
                                <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                    <p className="text-red-300 text-sm">{deployment.error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Progress & Results */}
                    <div className="lg:col-span-2">
                        {deployment.isDeploying ? (
                            // Deployment Progress
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 rounded-2xl p-8 border border-gray-700"
                            >
                                <h2 className="text-2xl font-bold text-white mb-8">Building Your Site</h2>

                                {/* Progress Bar */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm text-gray-400">Overall Progress</span>
                                        <span className="text-sm font-bold text-white">{Math.round(deployment.progress)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${deployment.progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>

                                {/* Step-by-step progress */}
                                <div className="space-y-3">
                                    {DEPLOYMENT_STEPS.map((step, i) => (
                                        <div
                                            key={step.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                                i < deployment.currentStep
                                                    ? 'bg-green-500/10 border border-green-500/30'
                                                    : i === deployment.currentStep - 1
                                                    ? 'bg-blue-500/10 border border-blue-500/30'
                                                    : 'bg-gray-700/30 border border-gray-600/30'
                                            }`}
                                        >
                                            <span className="text-2xl">
                                                {i < deployment.currentStep - 1 ? '✓' : step.icon}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">{step.label}</p>
                                                {i === deployment.currentStep - 1 && (
                                                    <p className="text-xs text-blue-300">{deployment.statusMessage}</p>
                                                )}
                                            </div>
                                            {i === deployment.currentStep - 1 && (
                                                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : deployment.deploymentResult?.success ? (
                            // Success Result
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 rounded-2xl p-8 border border-green-500/30 bg-green-500/5"
                            >
                                <div className="flex items-start gap-4 mb-8">
                                    <span className="text-5xl">🎉</span>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">Site Live!</h2>
                                        <p className="text-gray-400">Your professional website is now live</p>
                                    </div>
                                </div>

                                {/* Site Card */}
                                {deployment.generatedSite && (
                                    <div className="bg-gray-700/50 rounded-xl p-6 mb-8 border border-gray-600">
                                        <h3 className="font-bold text-white text-xl mb-2">{deployment.generatedSite.dnaName}</h3>
                                        <p className="text-gray-400 text-sm mb-4">Live URL:</p>
                                        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-4">
                                            <input
                                                type="text"
                                                value={deployment.deploymentResult?.siteUrl || `https://${deployment.generatedSite.id}.coredna.app`}
                                                readOnly
                                                className="flex-1 bg-transparent text-white text-sm outline-none"
                                            />
                                            <button
                                                onClick={() => handleCopyLink(deployment.generatedSite!)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleOpenSite(deployment.generatedSite!)}
                                                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>🌐</span>
                                                Open Site
                                            </button>
                                            <button
                                                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>💬</span>
                                                View Chat
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Deployment Details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-700/30 rounded-lg">
                                        <p className="text-gray-500 text-xs mb-1">Build Time</p>
                                        <p className="text-white font-bold">{(deployment.deploymentResult!.buildTime / 1000).toFixed(1)}s</p>
                                    </div>
                                    <div className="p-3 bg-gray-700/30 rounded-lg">
                                        <p className="text-gray-500 text-xs mb-1">Deployed At</p>
                                        <p className="text-white font-bold">
                                            {new Date(deployment.deploymentResult!.deployedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // Empty State
                            <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700 text-center">
                                <span className="text-6xl mb-4 block">🏗️</span>
                                <h2 className="text-2xl font-bold text-white mb-2">Ready to Build?</h2>
                                <p className="text-gray-400 mb-6">Select a brand and click "Build & Deploy Site" to generate your professional website</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                        <p className="text-blue-300 font-bold">5 Pages</p>
                                        <p className="text-gray-400 text-xs">Home, About, Services, Portfolio, Contact</p>
                                    </div>
                                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                        <p className="text-purple-300 font-bold">AI Chat</p>
                                        <p className="text-gray-400 text-xs">Sonic Agent embedded & ready</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Previous Deployments */}
                {deployedSites.length > 0 && !deployment.isDeploying && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Previously Built Sites</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deployedSites.map(site => (
                                <motion.div
                                    key={site.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{site.dnaName}</h3>
                                            <p className="text-xs text-gray-500">Built {new Date(site.generatedAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-2xl">🌐</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{site.title}</p>
                                    <button
                                        onClick={() => window.open(`https://${site.id}.coredna.app`, '_blank')}
                                        className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Open →
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteBuilderPage;
