# Why Settings Aren't Saving to Supabase

## The Current Flow

```
You save settings
    ↓
saveSettings() called
    ↓
localStorage.setItem() ← ALWAYS works (primary storage)
    ↓
Try Supabase.upsert() ← May fail silently
    ↓
If Supabase fails, return true anyway (because localStorage worked)
```

**Key Issue**: Supabase failures are silent - app says "saved" but only localStorage worked.

---

## Why Supabase Might Not Be Working

### Issue 1: Missing Environment Variables
**Check**: Browser console
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

If either shows `undefined`:
- `.env.local` isn't configured
- Vite dev server restarted and not picking up env vars
- Fix: `npm run dev` again after updating .env.local

### Issue 2: No user_settings Table
**Error**: `PGRST116` error code (table doesn't exist)

Supabase can't create tables automatically. You need to:
1. Go to Supabase dashboard
2. Create table: `user_settings`
3. Columns:
   - `user_id` (text, primary key)
   - `settings` (jsonb)
   - `updated_at` (timestamp)

### Issue 3: RLS (Row Level Security) Policy Blocking Writes
**Error**: `403 Forbidden` or `PGRST121`

Even with correct table, RLS policy might block anonymous users.

**Solution**: In Supabase dashboard:
1. Go to `user_settings` table
2. Click "RLS" tab
3. Disable RLS or create policy allowing inserts

### Issue 4: No Authentication
**Issue**: Using `DEFAULT_USER_ID = 'anonymous_user'`

Settings service uses `anonymous_user` as fallback:
```typescript
const userId = user?.id || DEFAULT_USER_ID;  // Falls back to 'anonymous_user'
```

This works fine for localStorage but Supabase might have auth requirements.

### Issue 5: CORS Issues
**Error**: Network error, no response

If Supabase is on different domain, CORS might block it.
But this usually gives network errors in console.

---

## How to Debug

### Step 1: Check Browser Console (F12)
Look for errors like:
```
[SettingsPage] Auto-saving settings...
Failed to get settings from Supabase: ...
Supabase unavailable, but settings saved to localStorage
```

### Step 2: Check What's Configured
```javascript
// In browser console:
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Should show:
```
VITE_SUPABASE_URL: https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY exists: true
```

If either is missing or undefined → Fix .env.local

### Step 3: Test Supabase Connection
```javascript
// In browser console:
import { supabase } from './services/supabaseClient.ts';

// Try to get session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Try to query settings table
const { data, error } = await supabase
  .from('user_settings')
  .select('*')
  .limit(1);
  
console.log('Query result:', { data, error });
```

**Expected**:
- Session might be null (anonymous is ok)
- Query should return data or `PGRST116` error (table doesn't exist)

### Step 4: Check localStorage vs Supabase
```javascript
// What's actually saved locally?
const local = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
console.log('localStorage settings:', local);

// Try to read from Supabase
const { data } = await supabase
  .from('user_settings')
  .select('settings')
  .eq('user_id', 'anonymous_user')
  .single();
  
console.log('Supabase settings:', data?.settings);
```

If localStorage has data but Supabase returns null → Settings aren't being saved to Supabase

---

## Current Behavior (Expected)

### Best Case
```
User saves → localStorage ✓ + Supabase ✓
Data persists across browser/devices
```

### Current Case (Likely)
```
User saves → localStorage ✓ + Supabase ✗ (silently fails)
Data persists in browser only
Reset browser data = lose settings
```

### Why This Is OK (For Now)
- localStorage works fine for single device
- User's API keys stay on their browser
- BYOK (Bring Your Own Keys) model
- No server-side storage needed for MVP

---

## How to Actually Store in Supabase

**File**: `services/settingsService.ts` needs:

1. **Create table** (in Supabase dashboard):
```sql
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disable RLS for MVP (enable later)
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Or add policy
CREATE POLICY "Allow anonymous insert" 
ON user_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anonymous select" 
ON user_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow anonymous update" 
ON user_settings 
FOR UPDATE 
USING (true);
```

2. **Fix the save logic**:
```typescript
// Current code silently ignores Supabase errors
// Should either:
// A) Log them properly
// B) Retry on failure
// C) Show warning to user
```

---

## What You Should Do

### Option A: Accept localStorage Only (Recommended for MVP)
- Settings stay on this device
- No Supabase needed for now
- Remove Supabase calls later if needed
- User can export/import settings manually

### Option B: Set Up Supabase Properly
1. Update `.env.local` with real Supabase URL & key
2. Create `user_settings` table in Supabase
3. Disable RLS (or add policies)
4. Restart dev server: `npm run dev`
5. Settings should now save to Supabase

### Option C: Hybrid (Current State)
- localStorage is the source of truth
- Supabase is optional backup
- If Supabase works great, if not no problem
- User data never lost (stays local)

---

## Current Code Behavior

**From settingsService.ts (line 48-101)**:

```typescript
export async function saveSettings(settings: GlobalSettings): Promise<boolean> {
  try {
    // STEP 1: Always save to localStorage first
    localStorage.setItem('core_dna_settings', JSON.stringify(sanitized));
    console.log('Settings saved to localStorage (primary)');

    // STEP 2: Try to save to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || DEFAULT_USER_ID;  // Falls back to anonymous
      
      const { error } = await supabase
        .from(SETTINGS_TABLE)  // 'user_settings'
        .upsert({...});

      if (error) {
        console.warn('Supabase save failed, but settings saved to localStorage');
        return true;  // ← Returns true even if Supabase fails!
      }

      console.log('Settings saved to Supabase');
      return true;
    } catch (supabaseError) {
      console.warn('Supabase unavailable, but settings saved to localStorage:', supabaseError);
      return true;  // ← Always returns true
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error(`Failed to save settings: ${error?.message}`);
  }
}
```

**Key Point**: Even if Supabase fails, function returns `true` because localStorage worked.

---

## Simple Test

In browser console:
```javascript
// Try to save directly
const { error } = await supabase
  .from('user_settings')
  .upsert({
    user_id: 'test_user',
    settings: { test: true },
    updated_at: new Date().toISOString()
  });

if (error) {
  console.error('Supabase error:', error.code, error.message);
} else {
  console.log('✓ Successfully saved to Supabase!');
}
```

This will tell you exactly why it's failing.

---

## TL;DR

**Is Supabase required?** No - localStorage works fine.

**Why isn't it saving to Supabase?**
1. `.env.local` might be missing Supabase credentials
2. `user_settings` table doesn't exist
3. RLS policy is blocking writes
4. It might actually be working but errors are silent

**What to do?**
- Check browser console for Supabase errors
- Run test command above
- If Supabase credentials in .env.local are wrong, fix them
- If table doesn't exist, create it in Supabase dashboard
- If RLS blocking, disable it

**For now?** localStorage is working fine. Settings are persisted on your device.
