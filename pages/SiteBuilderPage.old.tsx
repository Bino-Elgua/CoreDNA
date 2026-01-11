
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, GlobalSettings } from '../types';
import { siteGeneratorService, GeneratedSite } from '../services/siteGeneratorService';
import { rocketNewService, RocketNewDeploymentResult } from '../services/rocketNewService';
import { firebaseDeploymentService } from '../services/firebaseDeploymentService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DEPLOYMENT_STEPS = [
    { id: 1, label: 'Analyzing DNA', icon: '🧬' },
    { id: 2, label: 'Generating structure & copy', icon: '📝' },
    { id: 3, label: 'Creating visuals', icon: '🎨' },
    { id: 4, label: 'Building pages', icon: '🏗️' },
    { id: 5, label: 'Embedding Sonic Agent', icon: '🎤' },
    { id: 6, label: 'Deploying to Rocket.new', icon: '🚀' },
];

interface DeploymentState {
    isDeploying: boolean;
    currentStep: number;
    progress: number;
    statusMessage: string;
    generatedSite: GeneratedSite | null;
    deploymentResult: RocketNewDeploymentResult | null;
    error: string | null;
}

const SiteBuilderPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<BrandDNA[]>([]);
    const [selectedDnaId, setSelectedDnaId] = useState('');
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [userTier, setUserTier] = useState<'free' | 'pro' | 'hunter' | 'agency'>('free');

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
    const [previewMode, setPreviewMode] = useState<'local' | 'rocket'>('local');

    // Load DNA profiles, settings, and tier
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

        // Use auth context user tier, fallback to localStorage
        if (user?.tier) {
            setUserTier(user.tier);
        } else {
            const storedTier = localStorage.getItem('user_tier') || 'free';
            setUserTier(storedTier as any);
        }

        const storedSites = localStorage.getItem('core_dna_deployed_sites');
        if (storedSites) {
            try {
                setDeployedSites(JSON.parse(storedSites));
            } catch (e) {}
        }
    }, [user]);

    const selectedDna = profiles.find(p => p.id === selectedDnaId);
    const isPaidTier = userTier === 'pro' || userTier === 'hunter' || userTier === 'agency';
    const hasRocketKey = !!localStorage.getItem('rocket_new_api_key');
    const canDeployLive = isPaidTier && hasRocketKey;

    const handleBuild = async () => {
        if (!selectedDna || !settings) {
            setDeployment(prev => ({ ...prev, error: 'Missing brand profile or settings' }));
            return;
        }

        // If Free/Core → local preview only
        if (!isPaidTier) {
            await handleLocalBuild();
            return;
        }

        // If Pro/Hunter but no Rocket key → show error
        if (!hasRocketKey) {
            setDeployment(prev => ({
                ...prev,
                error: 'Rocket.new API key not configured. Add it in Settings → Website Options.',
            }));
            return;
        }

        // If Pro/Hunter with key → deploy to Rocket.new
        await handleRocketNewDeploy();
    };

    const handleLocalBuild = async () => {
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
            const generatedSite = await siteGeneratorService.generateSite(
                selectedDna!,
                undefined,
                settings,
                (step, progress) => {
                    const stepIndex = DEPLOYMENT_STEPS.findIndex(s => s.label === step);
                    setDeployment(prev => ({
                        ...prev,
                        currentStep: stepIndex + 1,
                        progress: 10 + (progress * 0.9),
                        statusMessage: step,
                    }));
                }
            );

            setDeployment(prev => ({
                ...prev,
                isDeploying: false,
                currentStep: 5,
                progress: 100,
                statusMessage: 'Preview ready — local build (no deployment)',
                generatedSite,
                deploymentResult: null,
            }));

            setPreviewMode('local');
        } catch (e: any) {
            console.error('Local build error:', e);
            setDeployment(prev => ({
                ...prev,
                isDeploying: false,
                error: e.message || 'Build failed',
            }));
        }
    };

    const handleRocketNewDeploy = async () => {
        setDeployment({
            isDeploying: true,
            currentStep: 1,
            progress: 10,
            statusMessage: 'Building deployment payload...',
            generatedSite: null,
            deploymentResult: null,
            error: null,
        });

        try {
            // Generate site structure first
            const generatedSite = await siteGeneratorService.generateSite(
                selectedDna!,
                undefined,
                settings,
                (step, progress) => {
                    const stepIndex = DEPLOYMENT_STEPS.findIndex(s => s.label === step);
                    setDeployment(prev => ({
                        ...prev,
                        currentStep: Math.min(stepIndex + 1, 5),
                        progress: 10 + (progress * 0.4),
                        statusMessage: step,
                    }));
                }
            );

            setDeployment(prev => ({
                ...prev,
                generatedSite,
                currentStep: 6,
                progress: 50,
                statusMessage: 'Sending to Rocket.new...',
            }));

            // Deploy to Rocket.new (automatically pulls Sonic Lab data from BrandDNA)
            const rocketKey = localStorage.getItem('rocket_new_api_key') || '';

            const result = await rocketNewService.deploySite(
                selectedDna!,
                rocketKey,
                (message, progress) => {
                    setDeployment(prev => ({
                        ...prev,
                        progress: 50 + (progress * 0.5),
                        statusMessage: message,
                    }));
                }
            );

            if (!result.success) {
                throw new Error(result.error || 'Deployment failed');
            }

            const updatedSites = [...deployedSites, generatedSite];
            setDeployedSites(updatedSites);
            localStorage.setItem('core_dna_deployed_sites', JSON.stringify(updatedSites));

            setDeployment(prev => ({
                ...prev,
                isDeploying: false,
                currentStep: 6,
                progress: 100,
                statusMessage: 'Site live — Sonic Agent active!',
                generatedSite,
                deploymentResult: result,
            }));

            setPreviewMode('rocket');
        } catch (e: any) {
            console.error('Rocket.new deployment error:', e);
            setDeployment(prev => ({
                ...prev,
                isDeploying: false,
                error: e.message || 'Deployment failed',
            }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-2"
                    >
                        ← Back
                    </button>
                    <h1 className="text-5xl font-bold text-white mb-2">Website Builder</h1>
                    <p className="text-xl text-gray-400">
                        {isPaidTier ? '🚀 Deploy real live sites with Rocket.new' : '📋 Preview local build (Free tier)'}
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Controls */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 sticky top-24">
                            {/* Tier Badge */}
                            <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <p className="text-xs font-bold text-blue-300 uppercase">Current Tier</p>
                                <p className="text-lg font-bold text-white capitalize mt-1">{userTier}</p>
                                {!isPaidTier && (
                                    <button className="mt-3 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded font-bold transition-colors">
                                        Upgrade to Pro
                                    </button>
                                )}
                            </div>

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
                                onClick={handleBuild}
                                disabled={deployment.isDeploying || !selectedDna}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold shadow-lg hover:shadow-blue-500/50 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deployment.isDeploying ? (
                                    <>
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        {isPaidTier ? 'Deploying...' : 'Building...'}
                                    </>
                                ) : (
                                    <>
                                        <span>{isPaidTier ? '🚀' : '📋'}</span>
                                        {isPaidTier ? 'Deploy to Rocket.new' : 'Build Local Preview'}
                                    </>
                                )}
                            </button>

                            {/* Error Message */}
                            {deployment.error && (
                                <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                    <p className="text-red-300 text-sm">{deployment.error}</p>
                                </div>
                            )}

                            {/* Rocket.new Status */}
                            {isPaidTier && (
                                <div className={`mt-4 p-4 rounded-lg border text-sm ${
                                    hasRocketKey
                                        ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                        : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                                }`}>
                                    <p className="font-bold mb-1">
                                        {hasRocketKey ? '✓ Rocket.new Connected' : '⚠ Rocket.new Not Connected'}
                                    </p>
                                    <p className="text-xs">
                                        {hasRocketKey
                                            ? 'Ready to deploy live sites'
                                            : 'Add API key in Settings → Website Options'
                                        }
                                    </p>
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
                                <h2 className="text-2xl font-bold text-white mb-8">
                                    {isPaidTier ? 'Deploying to Rocket.new' : 'Building Preview'}
                                </h2>

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
                                    {DEPLOYMENT_STEPS.slice(0, isPaidTier ? 6 : 5).map((step, i) => (
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
                        ) : deployment.deploymentResult?.success && isPaidTier ? (
                            // Rocket.new Success
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 rounded-2xl p-8 border border-green-500/30 bg-green-500/5"
                            >
                                <div className="flex items-start gap-4 mb-8">
                                    <span className="text-5xl">🎉</span>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">Live on Rocket.new!</h2>
                                        <p className="text-gray-400">Your professional website is now deployed</p>
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
                                                value={deployment.deploymentResult?.siteUrl || ''}
                                                readOnly
                                                className="flex-1 bg-transparent text-white text-sm outline-none truncate"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(deployment.deploymentResult?.siteUrl || '');
                                                    alert('Link copied!');
                                                }}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => window.open(deployment.deploymentResult?.siteUrl, '_blank')}
                                                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>🌐</span>
                                                Open Site
                                            </button>
                                            <button
                                                onClick={() => window.open(deployment.deploymentResult?.chatUrl, '_blank')}
                                                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>💬</span>
                                                Test Chat
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
                                        <p className="text-gray-500 text-xs mb-1">Deployed</p>
                                        <p className="text-white font-bold">Just now</p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : deployment.generatedSite && !isPaidTier ? (
                            // Local Preview + Upgrade Banner
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Upgrade Banner */}
                                <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-6 text-white border border-orange-400">
                                    <div className="flex items-start gap-4">
                                        <span className="text-4xl">🚀</span>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold mb-2">Ready for a Real Live Site?</h3>
                                            <p className="text-sm text-orange-100 mb-4">
                                                Upgrade to <strong>Pro</strong> to deploy this site to Rocket.new with a live URL and 24/7 Sonic Agent chat.
                                            </p>
                                            <button className="px-6 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors">
                                                Upgrade to Pro →
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Local Preview */}
                                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                                    <h3 className="text-xl font-bold text-white mb-4">📋 Local Preview</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        This is a preview of what your site will look like. It's not deployed live.
                                    </p>
                                    <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 text-center">
                                        <p className="text-gray-400">Preview rendering not available in this view</p>
                                        <p className="text-xs text-gray-500 mt-2">Full site preview coming soon</p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // Empty State
                            <div className="bg-gray-800 rounded-2xl p-12 border border-gray-700 text-center">
                                <span className="text-6xl mb-4 block">{isPaidTier ? '🚀' : '📋'}</span>
                                <h2 className="text-2xl font-bold text-white mb-2">Ready to Build?</h2>
                                <p className="text-gray-400 mb-6">
                                    {isPaidTier
                                        ? 'Select a brand and deploy to Rocket.new for a live, deployed site with Sonic Agent'
                                        : 'Select a brand and build a local preview of your site'
                                    }
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className={`p-3 rounded-lg border ${isPaidTier ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                                        <p className={`${isPaidTier ? 'text-blue-300' : 'text-blue-300'} font-bold`}>5+ Pages</p>
                                        <p className="text-gray-400 text-xs">Home, About, Services, Portfolio, Contact</p>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isPaidTier ? 'bg-purple-500/10 border-purple-500/30' : 'opacity-50'}`}>
                                        <p className={`${isPaidTier ? 'text-purple-300' : 'text-gray-400'} font-bold`}>AI Chat</p>
                                        <p className={`text-xs ${isPaidTier ? 'text-gray-400' : 'text-gray-500'}`}>Sonic Agent {isPaidTier ? 'embedded & live' : '(pro only)'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteBuilderPage;
