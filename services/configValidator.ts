/**
 * Configuration Validator
 * Check what's configured in settings and report status
 */

export interface ConfigStatus {
  hasSettings: boolean;
  imageProviders: {
    active?: string;
    available: string[];
    configured: Record<string, { hasKey: boolean; keyLength?: number }>;
  };
  videoProviders: {
    active?: string;
    available: string[];
    configured: Record<string, { hasKey: boolean; keyLength?: number }>;
  };
  llmProviders: {
    active?: string;
    available: string[];
    configured: Record<string, { hasKey: boolean; keyLength?: number }>;
  };
  issues: string[];
}

export function validateConfig(): ConfigStatus {
  const status: ConfigStatus = {
    hasSettings: false,
    imageProviders: {
      available: [],
      configured: {}
    },
    videoProviders: {
      available: [],
      configured: {}
    },
    llmProviders: {
      available: [],
      configured: {}
    },
    issues: []
  };

  try {
    const settingsStr = localStorage.getItem('core_dna_settings');
    if (!settingsStr) {
      status.issues.push('No settings found in localStorage');
      return status;
    }

    const settings = JSON.parse(settingsStr);
    status.hasSettings = true;

    // Check LLM providers
    if (settings.activeLLM) {
      status.llmProviders.active = settings.activeLLM;
    }
    if (settings.llms) {
      Object.entries(settings.llms).forEach(([key, config]: [string, any]) => {
        const hasKey = !!(config.apiKey?.trim?.());
        status.llmProviders.available.push(key);
        status.llmProviders.configured[key] = {
          hasKey,
          keyLength: hasKey ? config.apiKey.length : undefined
        };
      });
    }

    // Check image providers
    if (settings.activeImageGen) {
      status.imageProviders.active = settings.activeImageGen;
    }
    if (settings.image) {
      Object.entries(settings.image).forEach(([key, config]: [string, any]) => {
        const hasKey = !!(config.apiKey?.trim?.());
        status.imageProviders.available.push(key);
        status.imageProviders.configured[key] = {
          hasKey,
          keyLength: hasKey ? config.apiKey.length : undefined
        };
      });
    }

    // Check video providers
    if (settings.activeVideo) {
      status.videoProviders.active = settings.activeVideo;
    }
    if (settings.video) {
      Object.entries(settings.video).forEach(([key, config]: [string, any]) => {
        const hasKey = !!(config.apiKey?.trim?.());
        status.videoProviders.available.push(key);
        status.videoProviders.configured[key] = {
          hasKey,
          keyLength: hasKey ? config.apiKey.length : undefined
        };
      });
    }

    // Validate and report issues
    if (!status.imageProviders.active) {
      status.issues.push('No active image provider selected (activeImageGen)');
    }
    if (status.imageProviders.available.length === 0) {
      status.issues.push('No image providers configured');
    } else {
      const configuredWithKey = Object.entries(status.imageProviders.configured).filter(
        ([_, c]) => c.hasKey
      );
      if (configuredWithKey.length === 0) {
        status.issues.push('Image providers configured but no API keys set');
      }
    }

    if (status.llmProviders.available.length === 0) {
      status.issues.push('No LLM providers configured');
    } else {
      const configuredWithKey = Object.entries(status.llmProviders.configured).filter(
        ([_, c]) => c.hasKey
      );
      if (configuredWithKey.length === 0) {
        status.issues.push('LLM providers configured but no API keys set');
      }
    }

    return status;
  } catch (error: any) {
    status.issues.push(`Error reading settings: ${error.message}`);
    return status;
  }
}

export function logConfigStatus(): void {
  const status = validateConfig();
  
  console.log('=== COREDNA2 Configuration Status ===');
  console.log('Settings Found:', status.hasSettings);
  
  console.log('\n--- LLM Providers ---');
  console.log('Active:', status.llmProviders.active || 'None');
  console.log('Available:', status.llmProviders.available.join(', ') || 'None');
  Object.entries(status.llmProviders.configured).forEach(([provider, config]) => {
    console.log(`  ${provider}: ${config.hasKey ? '✓ API Key' : '✗ No key'}`);
  });

  console.log('\n--- Image Providers ---');
  console.log('Active:', status.imageProviders.active || 'None');
  console.log('Available:', status.imageProviders.available.join(', ') || 'None');
  Object.entries(status.imageProviders.configured).forEach(([provider, config]) => {
    console.log(`  ${provider}: ${config.hasKey ? '✓ API Key' : '✗ No key'}`);
  });

  console.log('\n--- Video Providers ---');
  console.log('Active:', status.videoProviders.active || 'None');
  console.log('Available:', status.videoProviders.available.join(', ') || 'None');
  Object.entries(status.videoProviders.configured).forEach(([provider, config]) => {
    console.log(`  ${provider}: ${config.hasKey ? '✓ API Key' : '✗ No key'}`);
  });

  if (status.issues.length > 0) {
    console.log('\n--- ⚠️ Issues ---');
    status.issues.forEach((issue) => {
      console.log(`  • ${issue}`);
    });
  } else {
    console.log('\n✓ All configurations look good!');
  }
}
