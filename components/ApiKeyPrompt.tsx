import React, { useState, useMemo } from 'react';
import { toastService } from '../services/toastService';
import { validator, ValidationError } from '../services/validationService';

interface ApiKeyPromptProps {
  onComplete: () => void;
}

export function ApiKeyPrompt({ onComplete }: ApiKeyPromptProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Validate API key format (basic check)
  const validateApiKey = (key: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!key || !key.trim()) {
      errors.push({ field: 'geminiKey', message: 'API key is required' });
    } else if (key.length < 20) {
      errors.push({ field: 'geminiKey', message: 'API key appears too short' });
    } else if (!key.startsWith('AIza')) {
      errors.push({ field: 'geminiKey', message: 'Gemini API keys should start with "AIza"' });
    }
    
    return errors;
  };

  // Real-time validation as user types
  const handleKeyChange = (value: string) => {
    setGeminiKey(value);
    if (value.trim()) {
      const errors = validateApiKey(value);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  };

  const saveAndContinue = () => {
    // Validate before saving
    const errors = validateApiKey(geminiKey);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      errors.forEach(err => {
        toastService.error(err.message);
      });
      return;
    }

    setIsLoading(true);

    // Save to localStorage
    const apiKeys = { gemini: geminiKey.trim() };
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));

    // Log validation success
    console.log('[ApiKeyPrompt] Validation successful, API key saved');
    toastService.success('API key saved! Ready to extract DNA');

    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const skipForNow = () => {
    if (confirm('⚠️ Without an API key, CoreDNA cannot generate content. You can add one later in Settings. Continue anyway?')) {
      localStorage.setItem('apiPromptDismissed', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🧬</div>
          <h2 className="text-3xl font-bold mb-2">Welcome to CoreDNA!</h2>
          <p className="text-gray-600">
            Your AI-powered brand intelligence platform
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Quick Setup: Get Your FREE API Key
          </h3>
          <ul className="text-sm text-blue-800 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>1,500 requests/day</strong> free forever</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>No credit card</strong> required</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Takes 30 seconds</strong> to get started</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span><strong>Your key, your data</strong> - stored locally only</span>
            </li>
          </ul>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <span>🚀</span>
            Get Free Gemini API Key
            <span>→</span>
          </a>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Paste your API key here
            </label>
            <input
              type="password"
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:outline-none text-lg transition-colors ${
                validationErrors.length > 0
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && saveAndContinue()}
            />
            {validationErrors.length > 0 && (
              <div className="mt-3 space-y-2">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-600 font-bold text-lg flex-shrink-0">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-red-800">{err.field}</p>
                      <p className="text-sm text-red-700">{err.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveAndContinue}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Saving...' : '✨ Save & Start Extracting DNA'}
            </button>
          </div>

          <button
            onClick={skipForNow}
            className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Skip for now (limited functionality)
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          🔒 Your API key is stored locally in your browser only.<br />
          CoreDNA never sees or has access to your keys.
        </p>

        <p className="text-xs text-gray-500 text-center mt-2">
          💡 You can add more providers (OpenAI, Claude, etc.) later in Settings
        </p>
      </div>
    </div>
  );
}
