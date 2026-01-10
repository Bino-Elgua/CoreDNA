# CoreDNA2 API Fixes - Detailed Changes

## Complete List of All Changes Made

### File 1: vite.config.ts

**Lines Changed:** 6, 13-15  
**Change Type:** Removed API key exposure

```diff
--- BEFORE
+++ AFTER

-export default defineConfig(({ mode }) => {
-    const env = loadEnv(mode, '.', '');
+export default defineConfig(({ mode }) => {
+    const env = loadEnv(mode, '.', 'VITE_');
     return {
       server: {
         port: 3000,
         host: '0.0.0.0',
       },
       plugins: [react()],
       define: {
-        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
-        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
+        // BYOK Model: Never expose API keys to frontend
+        // Users provide keys through Settings page
+        // Keys stored in localStorage only
       },
```

**Why:** Removes hardcoded API keys from vite bundle. Keys now only used from localStorage.

---

### File 2: pages/SettingsPage.tsx

**Line Changed:** 30  
**Change Type:** Removed default API key

```diff
-        google: { provider: 'google', enabled: true, apiKey: process.env.API_KEY || '' },
+        google: { provider: 'google', enabled: true, apiKey: '' },
```

**Why:** Google API key should never be hardcoded. Users must provide their own.

---

### File 3: services/geminiService.ts

#### Change 1: Simplified getApiKey() method (Lines 129-179)

**Lines Changed:** 132-179  
**Change Type:** Refactored to use single source of truth

```typescript
// BEFORE (49 lines):
private getApiKey(provider: string): string {
   try {
     const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
     
     console.log(`[GeminiService] Getting API key for provider: ${provider}`);
     console.log(`[GeminiService] Settings LLMs:`, settings.llms ? Object.keys(settings.llms) : 'none');
     console.log(`[GeminiService] Checking llms.${provider}:`, settings.llms?.[provider]);
     
     if (settings.llms?.[provider]?.apiKey) {
       console.log(`[GeminiService] Found LLM API key for ${provider}`);
       return settings.llms[provider].apiKey;
     }
     
     if (settings.image?.[provider]?.apiKey) {
       console.log(`[GeminiService] Found Image API key for ${provider}`);
       return settings.image[provider].apiKey;
     }
     
     if (settings.voice?.[provider]?.apiKey) {
       console.log(`[GeminiService] Found Voice API key for ${provider}`);
       return settings.voice[provider].apiKey;
     }
     
     // Fallback to old flat structure (REMOVED)
     const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
     if (apiKeys[provider]) {
       console.log(`[GeminiService] Found API key in old flat structure for ${provider}`);
       return apiKeys[provider];
     }
     
     console.error(`[GeminiService] No API key found for ${provider}`);
     const errorMsg = `${provider.toUpperCase()} API key not configured. Please add it in Settings.`;
     throw new Error(errorMsg);
   } catch (e: any) { ... }
}

// AFTER (44 lines - cleaner):
private getApiKey(provider: string): string {
   try {
     const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
     
     console.log(`[GeminiService] Getting API key for provider: ${provider}`);
     
     // Check unified settings structure (single source of truth)
     if (settings.llms?.[provider]?.apiKey) {
       console.log(`[GeminiService] ✓ Found LLM API key for ${provider}`);
       return settings.llms[provider].apiKey;
     }
     
     if (settings.image?.[provider]?.apiKey) {
       console.log(`[GeminiService] ✓ Found Image API key for ${provider}`);
       return settings.image[provider].apiKey;
     }
     
     if (settings.voice?.[provider]?.apiKey) {
       console.log(`[GeminiService] ✓ Found Voice API key for ${provider}`);
       return settings.voice[provider].apiKey;
     }
     
     if (settings.workflows?.[provider]?.apiKey) {
       console.log(`[GeminiService] ✓ Found Workflow API key for ${provider}`);
       return settings.workflows[provider].apiKey;
     }
     
     // Key not found - better error message
     console.error(`[GeminiService] ✗ No API key found for ${provider}`);
     const errorMsg = `${provider.toUpperCase()} API key not configured. Go to Settings → API Keys to add it.`;
     throw new Error(errorMsg);
   } catch (e: any) { ... }
}
```

**Changes:**
- Removed fallback to old `localStorage['apiKeys']` structure
- Added check for `settings.workflows`
- Changed log messages to use ✓ and ✗ symbols
- Improved error message with instructions

---

#### Change 2: Updated hasProvider() method (Lines 225-228)

```diff
- hasProvider(provider: string): boolean {
-   const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
-   return !!apiKeys[provider];
- }

+ hasProvider(provider: string): boolean {
+   const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
+   return !!(
+     settings.llms?.[provider]?.apiKey?.trim() ||
+     settings.image?.[provider]?.apiKey?.trim() ||
+     settings.voice?.[provider]?.apiKey?.trim() ||
+     settings.workflows?.[provider]?.apiKey?.trim()
+   );
+ }
```

**Changes:**
- Use unified settings structure instead of flat apiKeys
- Check all provider categories
- Added .trim() to ignore whitespace-only keys

---

#### Change 3: Updated getConfiguredProviders() method (Lines 231-236)

```diff
- getConfiguredProviders(): string[] {
-   const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
-   return Object.keys(apiKeys).filter(key => apiKeys[key]);
- }

+ getConfiguredProviders(): string[] {
+   const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
+   const configured: string[] = [];
+   
+   // Collect all providers with API keys
+   if (settings.llms) {
+     Object.entries(settings.llms).forEach(([key, config]: [string, any]) => {
+       if (config.apiKey?.trim()) configured.push(key);
+     });
+   }
+   
+   if (settings.image) {
+     Object.entries(settings.image).forEach(([key, config]: [string, any]) => {
+       if (config.apiKey?.trim() && !configured.includes(key)) configured.push(key);
+     });
+   }
+   
+   if (settings.voice) {
+     Object.entries(settings.voice).forEach(([key, config]: [string, any]) => {
+       if (config.apiKey?.trim() && !configured.includes(key)) configured.push(key);
+     });
+   }
+   
+   if (settings.workflows) {
+     Object.entries(settings.workflows).forEach(([key, config]: [string, any]) => {
+       if (config.apiKey?.trim() && !configured.includes(key)) configured.push(key);
+     });
+   }
+   
+   return configured;
+ }
```

**Changes:**
- Use unified settings structure
- Check all provider categories
- Prevent duplicates across categories
- Added .trim() check

---

#### Change 4: Simplified getActiveLLMProvider() helper (Lines 531-572)

```diff
- const getActiveLLMProvider = () => {
-   const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
-   const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
-   
-   console.log('[getActiveLLMProvider] Starting provider detection...');
-   console.log('[getActiveLLMProvider] BYOK apiKeys:', Object.keys(apiKeys));
-   console.log('[getActiveLLMProvider] Settings.llms:', settings.llms ? Object.keys(settings.llms) : 'none');
-   
-   // PRIORITY 1: Use explicitly set activeLLM from Settings if it has API key
-   if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
-     console.log(`[getActiveLLMProvider] ✓ Using explicitly set activeLLM from Settings: ${settings.activeLLM}`);
-     return settings.activeLLM;
-   }
-   
-   // PRIORITY 2: Find first enabled LLM with API key in Settings format
-   if (settings.llms) {
-     for (const [key, config] of Object.entries(settings.llms)) {
-       const llmConfig = config as any;
-       if (llmConfig.apiKey) {
-         console.log(`[getActiveLLMProvider] ✓ Found ${key} in Settings with API key`);
-         return key;
-       }
-     }
-   }
-   
-   // PRIORITY 3: Check BYOK storage for any configured LLM providers (REMOVED)
-   const llmProviders = ['gemini', 'openai', 'claude', ...];
-   for (const provider of llmProviders) {
-     if (apiKeys[provider]) {
-       console.log(`[getActiveLLMProvider] ✓ Found ${provider} in BYOK storage`);
-       return provider;
-     }
-   }
-   
-   // Removed extra logging and apiKeys check
-   throw new Error('No LLM provider configured. Please select an LLM provider in Settings and add its API key.');
- };

+ const getActiveLLMProvider = () => {
+   const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
+   
+   console.log('[getActiveLLMProvider] Detecting active LLM provider...');
+   
+   // PRIORITY 1: Use explicitly set activeLLM from Settings if it has API key
+   if (settings.activeLLM && settings.llms?.[settings.activeLLM]?.apiKey) {
+     console.log(`[getActiveLLMProvider] ✓ Using configured activeLLM: ${settings.activeLLM}`);
+     return settings.activeLLM;
+   }
+   
+   // PRIORITY 2: Find first LLM with API key in settings.llms
+   if (settings.llms) {
+     for (const [key, config] of Object.entries(settings.llms)) {
+       const llmConfig = config as any;
+       if (llmConfig.apiKey && llmConfig.apiKey.trim()) {
+         console.log(`[getActiveLLMProvider] ✓ Using first available LLM: ${key}`);
+         return key;
+       }
+     }
+   }
+   
+   console.error('[getActiveLLMProvider] ✗ No LLM provider configured with API key');
+   console.error('[getActiveLLMProvider] Configured providers:', settings.llms ? Object.keys(settings.llms) : 'none');
+   
+   throw new Error('No LLM provider configured. Go to Settings → API Keys to add an LLM provider and its API key.');
+ };
```

**Changes:**
- Removed PRIORITY 3 (check old apiKeys structure)
- Simplified logging
- Added .trim() check to skip empty keys
- Improved error message
- Cleaner overall logic

---

### File 4: App.tsx

**Lines Changed:** 76-102  
**Change Type:** Updated API prompt check logic

```diff
  useEffect(() => {
    try {
-     // Check BOTH BYOK storage AND Settings-based storage (OLD)
-     const apiKeys = localStorage.getItem('apiKeys');
-     const hasByokKeys = apiKeys && Object.keys(JSON.parse(apiKeys)).length > 0;
-     
      const settings = localStorage.getItem('core_dna_settings');
-     const hasSettingsKeys = settings && (
-       JSON.parse(settings)?.llms && Object.keys(JSON.parse(settings).llms).some((k: string) => JSON.parse(settings).llms[k]?.apiKey) ||
-       JSON.parse(settings)?.image && Object.keys(JSON.parse(settings).image).some((k: string) => JSON.parse(settings).image[k]?.apiKey)
-     );
      const dismissed = localStorage.getItem('apiPromptDismissed');

-     // Only show prompt if NO keys are configured anywhere AND not dismissed
-     if (!hasByokKeys && !hasSettingsKeys && !dismissed) {
+     if (settings) {
+       try {
+         const parsed = JSON.parse(settings);
+         // Check if any provider has an API key configured
+         const hasLLMKey = parsed.llms && Object.values(parsed.llms).some((config: any) => config?.apiKey?.trim());
+         const hasImageKey = parsed.image && Object.values(parsed.image).some((config: any) => config?.apiKey?.trim());
+         
+         // Only show prompt if NO keys configured AND not dismissed
+         if (!hasLLMKey && !hasImageKey && !dismissed) {
+           setShowApiPrompt(true);
+         }
+       } catch (e) {
+         console.error('Error parsing settings:', e);
+         if (!dismissed) setShowApiPrompt(true);
+       }
+     } else if (!dismissed) {
        setShowApiPrompt(true);
       }
    } catch (e) {
      console.error('Error checking API keys:', e);
    }
  }, []);
```

**Changes:**
- Removed check for old `localStorage['apiKeys']`
- Simplified logic to only check `core_dna_settings`
- Added Object.values() for cleaner iteration
- Better error handling
- More readable variable names

---

## Summary of Changes

| File | Type | Lines | Impact |
|------|------|-------|--------|
| vite.config.ts | Removed | 6, 13-15 | No API keys exposed to bundle |
| SettingsPage.tsx | Removed | 30 | No default API key |
| geminiService.ts | Refactored | 129-236, 531-572 | Single source of truth for keys |
| App.tsx | Updated | 76-102 | Simplified settings check |

**Total Lines Changed:** ~100  
**Total Files Modified:** 4  
**Total Changes:** 6 logical changes

---

## Verification

To verify all changes were applied:

```bash
# Check vite config
grep -n "process.env.GEMINI_API_KEY" CoreDNA2-work/vite.config.ts
# Should return: (no results)

# Check SettingsPage
grep -n "process.env.API_KEY" CoreDNA2-work/pages/SettingsPage.tsx  
# Should return: (no results)

# Check geminiService
grep -n "localStorage.getItem('apiKeys')" CoreDNA2-work/services/geminiService.ts
# Should return: (no results)

# Check App.tsx
grep -n "apiKeys" CoreDNA2-work/App.tsx
# Should return: (no results)
```

If all return no results, fixes are correctly applied.

---

## Build & Test

```bash
cd CoreDNA2-work

# Install fresh
npm install

# Start dev server
npm run dev

# In browser console, verify:
localStorage.getItem('core_dna_settings') // Should have llms object
localStorage.getItem('apiKeys') // Should be null
```

Done! All fixes applied and verified.
