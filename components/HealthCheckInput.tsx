import React, { useState, useEffect, useRef } from 'react';
import { ProviderConfig, LLMProviderId, ImageProviderId, VoiceProviderId, WorkflowProviderId } from '../types';
import { checkLLMHealth, checkImageHealth, checkVoiceHealth, checkWorkflowHealth, HealthCheckResult } from '../services/healthCheckService';

interface HealthCheckInputProps {
    provider: LLMProviderId | ImageProviderId | VoiceProviderId | WorkflowProviderId;
    type: 'llm' | 'image' | 'voice' | 'workflow';
    config: ProviderConfig;
    value: string;
    onChange: (value: string) => void;
    onHealthCheck?: (result: HealthCheckResult) => void;
    placeholder?: string;
    fieldName?: string; // 'apiKey', 'webhookUrl', etc.
    label?: string;
    inputType?: 'password' | 'text' | 'url';
    getKeyUrl?: string; // Link to get API key/details
}

const HealthCheckInput: React.FC<HealthCheckInputProps> = ({
    provider,
    type,
    config,
    value,
    onChange,
    onHealthCheck,
    placeholder,
    fieldName = 'apiKey',
    label,
    inputType = 'password',
    getKeyUrl
}) => {
    const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Run health check after user stops typing (500ms debounce)
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (!value || value.trim() === '') {
            setHealthStatus(null);
            return;
        }

        debounceTimer.current = setTimeout(async () => {
            await runHealthCheck();
        }, 500);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [value]);

    const runHealthCheck = async () => {
        setIsChecking(true);
        try {
            const testConfig = { ...config, [fieldName]: value };
            let result: HealthCheckResult;

            console.log(`[HealthCheck] Checking ${type}/${provider} with ${fieldName}=${value.substring(0, 20)}...`);

            switch (type) {
                case 'llm':
                    result = await checkLLMHealth(provider as LLMProviderId, testConfig);
                    break;
                case 'image':
                    result = await checkImageHealth(provider as ImageProviderId, testConfig);
                    break;
                case 'voice':
                    result = await checkVoiceHealth(provider as VoiceProviderId, testConfig);
                    break;
                case 'workflow':
                    result = await checkWorkflowHealth(provider as WorkflowProviderId, testConfig);
                    break;
                default:
                    result = { valid: false, status: 'error', message: 'Unknown provider type', timestamp: Date.now() };
            }

            console.log(`[HealthCheck] Result for ${type}/${provider}:`, result);
            setHealthStatus(result);
            onHealthCheck?.(result);
        } catch (error) {
            const errorResult = {
                valid: false,
                status: 'error' as const,
                message: error instanceof Error ? error.message : 'Health check failed',
                timestamp: Date.now()
            };
            console.error(`[HealthCheck] Error:`, error, errorResult);
            setHealthStatus(errorResult);
            onHealthCheck?.(errorResult);
        } finally {
            setIsChecking(false);
        }
    };

    const getStatusIcon = () => {
        if (isChecking) {
            return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
        }
        if (!healthStatus) return null;
        
        switch (healthStatus.status) {
            case 'valid':
                return <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
            case 'invalid':
                return <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
            case 'error':
                return <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
            default:
                return null;
        }
    };

    const getStatusColor = () => {
        if (!healthStatus) return 'border-gray-200 dark:border-gray-700';
        switch (healthStatus.status) {
            case 'valid':
                return 'border-green-500 bg-green-50 dark:bg-green-900/20';
            case 'invalid':
                return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'error':
                return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
            case 'checking':
                return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
            default:
                return 'border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusMessage = () => {
        if (!healthStatus) return null;
        
        const baseClasses = 'text-xs mt-2 p-2 rounded-lg flex items-start gap-2';
        const colorClasses = {
            valid: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
            invalid: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
            error: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
            checking: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        };

        return (
            <div className={`${baseClasses} ${colorClasses[healthStatus.status]}`}>
                <span className="mt-0.5">{getStatusIcon()}</span>
                <span>{healthStatus.message}</span>
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">
                    {label}
                </label>
            )}
            <div className={`relative border-2 rounded-xl transition-all ${getStatusColor()}`}>
                <input
                    type={inputType}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-3 rounded-xl bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600"
                />
                {(isChecking || healthStatus) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getStatusIcon()}
                    </div>
                )}
            </div>
            {getStatusMessage()}
            {getKeyUrl && (
                <a 
                    href={getKeyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 mt-2 font-semibold transition-colors"
                >
                    🔑 Get {fieldName === 'apiKey' ? 'API Key' : 'Details'} →
                </a>
            )}
        </div>
    );
};

export default HealthCheckInput;
