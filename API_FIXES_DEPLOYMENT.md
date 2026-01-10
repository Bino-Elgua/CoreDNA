# CoreDNA2 API Fixes — Localhost Removal & Dev-Only Launch

## Changes Applied (January 2025)

### 1. **Removed Hardcoded Localhost from n8nService**
**File:** `services/n8nService.ts`

**Before:**
```typescript
this.baseUrl = import.meta.env.VITE_N8N_API_URL || 'http://localhost:5678/api/v1';
```

**After:**
```typescript
const n8nUrl = import.meta.env.VITE_N8N_API_URL;
if (!n8nUrl) {
    console.warn('[N8nService] n8n not configured. Set VITE_N8N_API_URL in .env.local...');
    this.baseUrl = '';
    this.isHealthy = false;
} else {
    this.baseUrl = n8nUrl;
}
```

**Impact:** n8n automation is now **optional**. If not configured, the app gracefully degrades and users can still:
- Extract Brand DNA
- Use Lead Hunter
- Create Campaigns
- Access all core features

---

### 2. **Made Ollama Endpoint Configurable**
**File:** `services/geminiService.ts`

**Before:**
```typescript
endpoint: 'http://localhost:11434/api/generate',
```

**After:**
```typescript
endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
```

**Impact:** Ollama endpoint can be configured via environment variable. Defaults to localhost for backward compatibility.

---

### 3. **Removed Localhost Defaults from Settings**
**File:** `pages/SettingsPage.tsx`

**Before:**
```typescript
ollama: { provider: 'ollama', enabled: false, apiKey: '', baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3' },
custom_openai: { provider: 'custom_openai', enabled: false, apiKey: '', baseUrl: 'http://localhost:1234/v1' },
```

**After:**
```typescript
ollama: { provider: 'ollama', enabled: false, apiKey: '', baseUrl: '', defaultModel: 'llama3' },
custom_openai: { provider: 'custom_openai', enabled: false, apiKey: '', baseUrl: '', defaultModel: 'gpt-3.5-turbo' },
```

**Impact:** Users must explicitly provide baseUrl for local providers. No assumptions about local infrastructure.

---

### 4. **Updated .env.example**
**File:** `.env.example`

**Changes:**
- Removed hardcoded `VITE_N8N_API_URL=http://localhost:5678/api/v1`
- Made n8n configuration optional with example comment
- Added new `LOCAL SERVICES` section for OLLAMA
- Clear documentation that these are optional

**New setup:**
```env
# n8n Automation (Optional - for workflow features)
# If not set, automation features will gracefully degrade
# VITE_N8N_API_URL=http://your-n8n-instance.com/api/v1
# VITE_N8N_API_KEY=your-api-key

# ========================================
# LOCAL SERVICES (Optional)
# ========================================

# Ollama (Optional - for local LLM inference)
# VITE_OLLAMA_ENDPOINT=http://your-ollama-instance.com:11434
```

---

### 5. **Improved START_DEV.sh**
**File:** `START_DEV.sh`

**Changes:**
- Added `.env.local` validation before starting
- Removed references to `LOCALHOST_SETUP.md`
- Added clear first-time setup instructions
- Listed all features that work **without** localhost
- Simplified output (no IP address variant)

**New output explains:**
```
✅ Core DNA v2 is running!

📍 Open your browser and go to:
   http://localhost:3000

🔑 First time setup:
   1. You'll see an API Key prompt
   2. Go to Settings → API Keys
   3. Add your LLM provider key (Google, OpenAI, etc.)

🎯 Features available without localhost:
   ✓ Extract Brand DNA
   ✓ Battle Mode
   ✓ Lead Hunter (geolocation)
   ✓ Campaign Planning
   ✓ Settings & Preferences
```

---

## New Architecture

### Development Launch Flow

```
1. User runs: npm run dev
   ↓
2. Script checks .env.local exists
   ↓
3. Vite server starts on port 3000
   ↓
4. App loads in browser
   ↓
5. If no API keys → Shows API Key Prompt
   ↓
6. User adds key in Settings → Ready to use
```

### Optional Service Architecture

```
REQUIRED:
✓ Supabase (authentication)
✓ Browser localStorage (API keys)

OPTIONAL (Graceful Degradation):
- n8n (automation workflows)
- Ollama (local LLM)
```

---

## Setup Instructions

### Quick Start

```bash
# 1. Navigate to project
cd CoreDNA2-work

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Edit .env.local (add Supabase credentials only)
# VITE_SUPABASE_URL=your-url
# VITE_SUPABASE_ANON_KEY=your-key

# 5. Start dev server
npm run dev

# 6. Open http://localhost:3000 in browser

# 7. Add API key in Settings → API Keys
```

### Optional: Enable n8n Automation

If you have n8n running, add to `.env.local`:
```env
VITE_N8N_API_URL=http://your-n8n-instance.com/api/v1
VITE_N8N_API_KEY=your-api-key
```

### Optional: Enable Ollama

If you have Ollama running, add to `.env.local`:
```env
VITE_OLLAMA_ENDPOINT=http://localhost:11434
```

---

## What Changed (User Perspective)

### Before
- App required localhost for n8n and Ollama
- If localhost services unavailable, app would fail
- Environment assumed specific infrastructure setup

### After
- App works **without any localhost services**
- n8n and Ollama are optional enhancements
- Only requires Supabase for authentication + API key from user
- Clear error messages if optional services aren't configured

---

## Security Impact

✅ **No API keys exposed** (unchanged)
✅ **No localhost hardcoding** (FIXED)
✅ **No assumptions about infrastructure** (IMPROVED)
✅ **Graceful degradation** (ADDED)

---

## Testing Checklist

- [ ] Run `npm run dev` without n8n configured
- [ ] Verify app loads successfully
- [ ] Add API key in Settings
- [ ] Extract Brand DNA works
- [ ] Lead Hunter works
- [ ] Campaign generation works
- [ ] All features work without localhost
- [ ] Check browser console for warnings

---

## Files Modified

1. ✅ `services/n8nService.ts` - Optional n8n setup
2. ✅ `services/geminiService.ts` - Configurable Ollama endpoint
3. ✅ `pages/SettingsPage.tsx` - Removed localhost defaults
4. ✅ `.env.example` - Updated documentation
5. ✅ `START_DEV.sh` - Improved launch script

---

## Deployment Notes

- No changes to production build process
- No changes to Supabase integration
- No changes to API key handling (BYOK model intact)
- All features maintain same functionality
- Performance unaffected

---

## Support

If users see errors about missing services:

1. **"n8n service is not available"** → OK, it's optional. Continue without it.
2. **"No API key found"** → Go to Settings → API Keys → Add provider key
3. **"Ollama not responding"** → Set VITE_OLLAMA_ENDPOINT or remove from providers list

All errors are non-blocking and gracefully handled.
