# CoreDNA2 API Configuration Issues & Fixes

## Problem Summary

The CoreDNA2 application has **critical API routing and configuration issues** that cause failures when trying to use Gemini and other LLM providers. The app is not properly routing API requests through Supabase, and there are inconsistencies in how API keys are stored and retrieved.

---

## Critical Issues Found

### 1. **Hardcoded Gemini API Key in Environment Variables**
**Location:** `vite.config.ts` (lines 14-15)
**Problem:** 
- The vite config exposes `GEMINI_API_KEY` in `process.env`
- This should NEVER be exposed to the frontend
- Keys should only be managed through Supabase backend or localStorage (BYOK model)

```typescript
// WRONG - Exposing sensitive keys to frontend
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

### 2. **Default API Key in Settings (SettingsPage.tsx)**
**Location:** `pages/SettingsPage.tsx` (line 30)
**Problem:**
- Initializes with `process.env.API_KEY` which is hardcoded
- Creates security vulnerability
- Conflicts with BYOK model

```typescript
// WRONG - Hardcoded API key
google: { provider: 'google', enabled: true, apiKey: process.env.API_KEY || '' },
```

### 3. **Inconsistent API Key Storage Structure**
**Problem:** Three different storage mechanisms in use simultaneously:
1. **BYOK Model:** `localStorage.getItem('apiKeys')` - Flat structure like `{gemini: "key"}`
2. **Settings Model:** `localStorage.getItem('core_dna_settings')` - Nested structure like `{llms: {gemini: {apiKey: "key"}}}`
3. **Vite Config:** `process.env.GEMINI_API_KEY` - Frontend environment variable

**Evidence:**
- `geminiService.ts` (lines 134-179) checks all three locations
- Multiple priority systems causing confusion
- Functions check both `settings.llms` and flat `apiKeys`

### 4. **GeminiService Not Using Supabase at All**
**Location:** `services/geminiService.ts`
**Problem:**
- Makes **direct browser-to-API calls** to provider endpoints
- Completely bypasses Supabase backend
- No server-side validation or routing
- Security risk: API keys validated only on client side

```typescript
// WRONG - Direct API calls from browser
private async callGemini(apiKey: string, model: string, ...) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': apiKey, ... }
  });
}
```

### 5. **No API Proxy or Backend Integration**
**Problem:**
- No `api/` directory with backend route handlers
- Supabase client initialized but never used for API routing
- Settings service attempts Supabase save but API calls bypass it entirely
- No CORS proxy or request validation

**Missing:**
- Backend API routes to validate requests
- Supabase RLS policies
- Request signing/verification

### 6. **Localhost Hardcoded in Multiple Places**
**Locations:**
- `services/geminiService.ts` (line 85): `endpoint: 'http://localhost:11434/api/generate'` (Ollama)
- `components/ApiKeysSection.tsx` (lines 39, 101): Localhost links for Ollama and n8n
- `pages/SettingsPage.tsx` (line 44): `baseUrl: 'http://localhost:11434/v1'` (Ollama)

**Problem:** These won't work in production or different environments

### 7. **Multiple Provider Priority Systems (Confusing)**
**Location:** `services/geminiService.ts` (lines 531-572)
**Problem:** The `getActiveLLMProvider()` function has 3 fallback priorities:
1. Explicitly set `activeLLM` from Settings
2. First enabled LLM with API key in Settings format
3. First LLM with API key in BYOK storage

This causes unpredictable behavior when mixing storage formats.

---

## What Should Happen (Correct Architecture)

```
Frontend (App) 
    ↓
Browser Storage (localStorage with BYOK keys)
    ↓
Settings Service (reads/writes to localStorage AND Supabase)
    ↓
Supabase Backend (validates, stores, routes)
    ↓
External API Providers (Gemini, OpenAI, etc.)
```

### Current Wrong Flow:
```
Frontend (App)
    ↓
GeminiService (reads from localStorage or process.env)
    ↓
Direct Browser API Calls (to Gemini, OpenAI, etc.)
    ✗ Bypasses Supabase entirely
    ✗ Exposes API keys to client
```

---

## Required Fixes (In Priority Order)

### Fix 1: Remove Hardcoded API Keys from Vite Config
**File:** `vite.config.ts`

```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // REMOVE: define block with API_KEY exposure
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

### Fix 2: Remove Hardcoded API Key from Settings Default
**File:** `pages/SettingsPage.tsx` (line 30)

```typescript
// Change from:
google: { provider: 'google', enabled: true, apiKey: process.env.API_KEY || '' },

// To:
google: { provider: 'google', enabled: true, apiKey: '' },  // User must add key
```

### Fix 3: Create Unified API Key Storage in GeminiService
**File:** `services/geminiService.ts`

```typescript
/**
 * Get API key from localStorage ONLY (user-provided BYOK)
 * Single source of truth for all API keys
 */
private getApiKey(provider: string): string {
  try {
    // Try unified settings structure
    const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
    
    // Check if key exists in settings
    if (settings.llms?.[provider]?.apiKey) {
      return settings.llms[provider].apiKey;
    }
    if (settings.image?.[provider]?.apiKey) {
      return settings.image[provider].apiKey;
    }
    if (settings.voice?.[provider]?.apiKey) {
      return settings.voice[provider].apiKey;
    }
    
    throw new Error(`${provider.toUpperCase()} API key not configured in Settings`);
  } catch (e: any) {
    throw new Error(`Failed to retrieve ${provider} API key: ${e?.message}`);
  }
}

// Remove fallback to process.env entirely
```

### Fix 4: Create Backend API Routes (Optional but Recommended)
**Create:** `api/routes/llm.ts` and `api/routes/proxy.ts`

```typescript
// api/routes/llm.ts
export async function handleLLMRequest(req: Request) {
  const { provider, prompt, model, options } = await req.json();
  
  // Get API key from Supabase (validated, server-side)
  const apiKey = await getProviderApiKey(req.user.id, provider);
  
  // Call provider API with key
  const response = await callProvider(provider, apiKey, prompt, model, options);
  
  return response;
}
```

Then update `geminiService.ts` to POST to `/api/llm` instead of direct calls.

### Fix 5: Create Environment Variables Reference
**File:** `.env.example`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# DO NOT INCLUDE API KEYS HERE
# Users provide API keys through Settings page (BYOK model)

# Localhost Endpoints (for development)
# These will be replaced in production
VITE_OLLAMA_ENDPOINT=http://localhost:11434
VITE_N8N_ENDPOINT=http://localhost:5678
```

### Fix 6: Standardize API Key Storage
**File:** `services/geminiService.ts`

```typescript
// Single unified structure in localStorage:
// core_dna_settings = {
//   llms: {
//     gemini: { provider: 'gemini', enabled: true, apiKey: '...' },
//     openai: { provider: 'openai', enabled: false, apiKey: '' }
//   },
//   image: { ... },
//   voice: { ... },
//   activeLLM: 'gemini',
//   activeImageGen: 'google',
//   ...
// }

// NO MORE:
// apiKeys = { gemini: '...', openai: '...' }  // Flat storage
// process.env.GEMINI_API_KEY  // Frontend env exposure
```

### Fix 7: Simplify Provider Selection
**File:** `services/geminiService.ts` (getActiveLLMProvider function)

```typescript
const getActiveLLMProvider = () => {
  const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
  
  // If user explicitly set an LLM and it has an API key, use it
  if (settings.activeLLM) {
    const config = settings.llms?.[settings.activeLLM];
    if (config?.apiKey) {
      return settings.activeLLM;
    }
  }
  
  // Fallback: Find first enabled LLM with API key
  if (settings.llms) {
    for (const [key, config] of Object.entries(settings.llms)) {
      const llmConfig = config as any;
      if (llmConfig.enabled && llmConfig.apiKey) {
        return key;
      }
    }
  }
  
  // No provider configured
  throw new Error(
    'No LLM provider configured. ' +
    'Please go to Settings → API Keys and add a provider with an API key.'
  );
};
```

### Fix 8: Remove Localhost Hardcoding
**File:** `services/geminiService.ts`

Replace hardcoded URLs with environment variables:

```typescript
// Before:
ollama: {
  type: 'llm',
  defaultModel: 'gemma2:27b',
  endpoint: 'http://localhost:11434/api/generate',
  local: true
}

// After:
ollama: {
  type: 'llm',
  defaultModel: 'gemma2:27b',
  endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
  local: true
}
```

---

## Testing Checklist After Fixes

- [ ] Remove all `process.env.API_KEY` references
- [ ] Verify `vite.config.ts` doesn't expose API keys
- [ ] Test adding API key in Settings → API Keys
- [ ] Verify key is stored ONLY in `localStorage['core_dna_settings'].llms`
- [ ] Extract Brand DNA and verify it uses the key from settings
- [ ] Find Leads and verify geolocation works
- [ ] Test with multiple providers (Gemini, OpenAI, Claude)
- [ ] Verify no console errors about missing API keys
- [ ] Check that localhost endpoints use env variables

---

## Files to Modify

1. ✅ `vite.config.ts` - Remove API key exposure
2. ✅ `pages/SettingsPage.tsx` - Remove default API key
3. ✅ `services/geminiService.ts` - Simplify key retrieval
4. ✅ `.env.example` - Add VITE_ prefixed vars
5. ✅ `components/ApiKeysSection.tsx` - Ensure consistent storage format
6. ✅ All pages using `geminiService` - Verify they handle errors correctly

---

## Summary

**The core issue:** API keys are being exposed to the frontend via vite config, and the app is making direct browser-to-API calls instead of routing through Supabase. The app should use a BYOK (Bring Your Own Key) model where:

1. Keys are provided by users through the Settings page
2. Keys are stored ONLY in browser localStorage (not in code/env)
3. No keys are ever sent to CoreDNA servers
4. All API calls go directly from browser to provider (this is OK for BYOK)
5. OR: Create a proxy layer in Supabase if you want to validate/log requests

**Fix Priority:**
1. **IMMEDIATE:** Remove all `process.env.API_KEY` references
2. **HIGH:** Standardize to single storage format in `core_dna_settings`
3. **HIGH:** Remove localhost hardcoding, use env variables
4. **MEDIUM:** Simplify provider selection logic
5. **OPTIONAL:** Create backend proxy routes for request validation
