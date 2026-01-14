import React, { useState, useEffect } from 'react';

interface HealthStatus {
  llmProvider: string | null;
  llmConfigured: boolean;
  imageProvider: string | null;
  imageConfigured: boolean;
  videoProvider: string | null;
  videoConfigured: boolean;
  allProvidersChecked: boolean;
  errors: string[];
  warnings: string[];
}

const HealthCheckDisplay: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    llmProvider: null,
    llmConfigured: false,
    imageProvider: null,
    imageConfigured: false,
    videoProvider: null,
    videoConfigured: false,
    allProvidersChecked: false,
    errors: [],
    warnings: []
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkHealth();
    // Re-check every 5 seconds
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = () => {
    try {
      const settingsStr = localStorage.getItem('core_dna_settings');
      if (!settingsStr) {
        setHealth({
          llmProvider: null,
          llmConfigured: false,
          imageProvider: null,
          imageConfigured: false,
          videoProvider: null,
          videoConfigured: false,
          allProvidersChecked: true,
          errors: ['❌ No settings found - go to Settings page first'],
          warnings: []
        });
        return;
      }

      const settings = JSON.parse(settingsStr);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check LLM
      const activeLLM = settings.activeLLM;
      const llmConfigured = activeLLM && settings.llms?.[activeLLM]?.apiKey?.trim();
      if (!llmConfigured) {
        errors.push('❌ No LLM provider configured - go to Settings → API Keys → add LLM provider');
      }

      // Check Image
      const activeImage = settings.activeImageGen;
      const imageConfigured = activeImage && settings.image?.[activeImage]?.apiKey?.trim();
      if (!imageConfigured) {
        errors.push('❌ No Image provider configured - go to Settings → API Keys → Image → add provider');
      }

      // Check Video (optional)
      const activeVideo = settings.activeVideo;
      const videoConfigured = activeVideo && settings.video?.[activeVideo]?.apiKey?.trim();
      if (!videoConfigured) {
        warnings.push('⚠️ No Video provider configured (optional - campaigns will work without)');
      }

      setHealth({
        llmProvider: activeLLM || 'Not set',
        llmConfigured: !!llmConfigured,
        imageProvider: activeImage || 'Not set',
        imageConfigured: !!imageConfigured,
        videoProvider: activeVideo || 'Not set',
        videoConfigured: !!videoConfigured,
        allProvidersChecked: true,
        errors,
        warnings
      });
    } catch (e) {
      setHealth({
        llmProvider: null,
        llmConfigured: false,
        imageProvider: null,
        imageConfigured: false,
        videoProvider: null,
        videoConfigured: false,
        allProvidersChecked: true,
        errors: ['❌ Error reading settings: ' + (e instanceof Error ? e.message : String(e))],
        warnings: []
      });
    }
  };

  const isHealthy = health.llmConfigured && health.imageConfigured;
  const statusColor = isHealthy ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500';
  const statusIcon = isHealthy ? '✅' : '❌';

  if (!health.allProvidersChecked) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 rounded-lg border p-3 text-sm z-50 ${statusColor} backdrop-blur`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-white hover:opacity-80"
      >
        <span className="font-bold">
          {statusIcon} System Health
        </span>
        <span className="text-xs">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 text-xs max-h-96 overflow-y-auto">
          {/* Status Summary */}
          <div className="bg-black/30 p-2 rounded border border-white/10">
            <p className="font-bold mb-2">Status Summary:</p>
            <p className={health.llmConfigured ? 'text-green-300' : 'text-red-300'}>
              {health.llmConfigured ? '✅' : '❌'} LLM: {health.llmProvider}
            </p>
            <p className={health.imageConfigured ? 'text-green-300' : 'text-red-300'}>
              {health.imageConfigured ? '✅' : '❌'} Image: {health.imageProvider}
            </p>
            <p className={health.videoConfigured ? 'text-green-300' : 'text-yellow-300'}>
              {health.videoConfigured ? '✅' : '⚠️'} Video: {health.videoProvider}
            </p>
          </div>

          {/* Errors */}
          {health.errors.length > 0 && (
            <div className="bg-red-900/30 p-2 rounded border border-red-500/50">
              <p className="font-bold text-red-300 mb-1">Errors:</p>
              {health.errors.map((err, i) => (
                <p key={i} className="text-red-200 break-words mb-1">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Warnings */}
          {health.warnings.length > 0 && (
            <div className="bg-yellow-900/30 p-2 rounded border border-yellow-500/50">
              <p className="font-bold text-yellow-300 mb-1">Warnings:</p>
              {health.warnings.map((warn, i) => (
                <p key={i} className="text-yellow-200 break-words mb-1">
                  {warn}
                </p>
              ))}
            </div>
          )}

          {/* Quick Fix */}
          {health.errors.length > 0 && (
            <div className="bg-blue-900/30 p-2 rounded border border-blue-500/50">
              <p className="font-bold text-blue-300">Quick Fix:</p>
              <p className="text-blue-200 mt-1">
                Go to Settings → scroll to "API Keys" section → add your API keys for missing providers
              </p>
            </div>
          )}

          {/* All Good */}
          {health.errors.length === 0 && (
            <div className="bg-green-900/30 p-2 rounded border border-green-500/50">
              <p className="font-bold text-green-300">✅ All systems ready!</p>
              <p className="text-green-200 mt-1">You can now:</p>
              <ul className="text-green-200 ml-2 mt-1">
                <li>• Extract brand DNA</li>
                <li>• Generate campaigns with images</li>
                {health.videoConfigured && <li>• Generate videos</li>}
              </ul>
            </div>
          )}

          <button
            onClick={checkHealth}
            className="w-full mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold"
          >
            Refresh Health Check
          </button>
        </div>
      )}
    </div>
  );
};

export default HealthCheckDisplay;
