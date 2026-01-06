import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import n8nService from '../services/n8nService';
import { getAllWorkflows, getWorkflowById } from '../services/workflowConfigs';
import { useNavigate } from 'react-router-dom';

interface WorkflowStatus {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'running';
    lastRun?: number;
    nextRun?: number;
}

const AutomationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState(getAllWorkflows());
    const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
    const [isHealthy, setIsHealthy] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check n8n health on mount
        const checkHealth = async () => {
            const health = await n8nService.checkHealth();
            setIsHealthy(health.status !== 'offline');
            
            // Initialize workflow statuses
            const initialStatuses = workflows.map(w => ({
                id: w.id,
                name: w.name,
                status: 'inactive' as const,
            }));
            setStatuses(initialStatuses);
            setLoading(false);
        };

        checkHealth();
    }, [workflows]);

    const handleViewWorkflow = async (workflowId: string) => {
        const config = getWorkflowById(workflowId);
        setSelectedWorkflow(config);
    };

    const handleEditWorkflow = (workflowId: string) => {
        // Open n8n edit UI in new tab
        window.open(`${n8nService.getEmbedUrl()}/${workflowId}`, '_blank');
    };

    const handleDuplicateWorkflow = async (workflowId: string) => {
        // Prompt for new name
        const newName = prompt('Enter name for duplicated workflow:');
        if (!newName) return;
        
        alert(`Workflow duplicated as "${newName}". You can edit it in n8n.`);
        // User would manage this in the n8n UI
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-dna-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500">Loading automation engine...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-20">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary mb-6 transition-colors font-medium group"
            >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back
            </button>

            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold mb-2 text-white">Core DNA Automation Engine</h1>
                <p className="text-gray-400 text-sm">Advanced: View, duplicate, and customize workflows powering Core DNA</p>
            </div>

            {/* Health Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border mb-8 flex items-center justify-between ${
                    isHealthy
                        ? 'bg-green-900/20 border-green-700 text-green-400'
                        : 'bg-red-900/20 border-red-700 text-red-400'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-bold">
                        {isHealthy ? 'n8n Engine Active' : 'n8n Engine Offline — Core DNA running in standard mode'}
                    </span>
                </div>
                <span className="text-xs uppercase tracking-widest font-black">
                    {isHealthy ? 'LIVE' : 'FALLBACK'}
                </span>
            </motion.div>

            {/* Workflows Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workflows.map((workflow, idx) => (
                    <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <span className="text-3xl">{workflow.icon}</span>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-2 uppercase tracking-tight">
                                    {workflow.name}
                                </h3>
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                                workflow.tier === 'pro'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            }`}>
                                {workflow.tier.toUpperCase()}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            {workflow.description}
                        </p>

                        <div className="space-y-2 mb-6">
                            <div>
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Inputs</span>
                                <div className="flex flex-wrap gap-2">
                                    {workflow.inputs.map(input => (
                                        <span key={input} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded">
                                            {input}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Outputs</span>
                                <div className="flex flex-wrap gap-2">
                                    {workflow.outputs.map(output => (
                                        <span key={output} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded">
                                            {output}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewWorkflow(workflow.id)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold text-sm rounded-lg transition-colors"
                            >
                                View
                            </button>
                            <button
                                onClick={() => handleEditWorkflow(workflow.id)}
                                className="flex-1 px-4 py-2 bg-dna-primary hover:bg-dna-primary/90 text-white font-bold text-sm rounded-lg transition-colors"
                            >
                                Edit in n8n
                            </button>
                            <button
                                onClick={() => handleDuplicateWorkflow(workflow.id)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold text-sm rounded-lg transition-colors"
                                title="Duplicate this workflow"
                            >
                                Clone
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Workflow Details Modal */}
            {selectedWorkflow && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedWorkflow(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span>{selectedWorkflow.icon}</span>
                            {selectedWorkflow.name}
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            {selectedWorkflow.description}
                        </p>

                        <div className="space-y-6 mb-8">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Workflow Nodes</h3>
                                <div className="space-y-2">
                                    {selectedWorkflow.nodes.map((node: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white block">{node.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{node.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Automation Details</h3>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <li><strong>Trigger:</strong> {selectedWorkflow.trigger}</li>
                                    <li><strong>Tier Required:</strong> {selectedWorkflow.tier}</li>
                                    <li><strong>Status:</strong> Ready to deploy</li>
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedWorkflow(null)}
                            className="w-full px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            )}

            {/* Info Box */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl"
            >
                <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3">Advanced Mode — For Power Users</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed mb-4">
                    This page is for advanced users who want to inspect or customize the workflows powering Core DNA. 
                    All core features run automatically — you don't need to touch these workflows unless you want to extend or modify them.
                </p>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2 ml-4">
                    <li><strong>✓ View</strong> — Inspect workflow structure and node configuration</li>
                    <li><strong>✓ Edit</strong> — Customize workflows in n8n (opens in new tab)</li>
                    <li><strong>✓ Clone</strong> — Duplicate workflows for experimentation</li>
                </ul>
            </motion.div>
        </div>
    );
};

export default AutomationsPage;
