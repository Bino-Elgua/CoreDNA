# CoreDNA 2.0 - Deployment & Setup Guide

## Priority 1: Backend Persistence ✅

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or sign in
3. Create a new project (name: `corédna2`, region: closest to you)
4. Wait for project initialization (~2 min)

#### Get Credentials
1. Go to **Settings > API**
2. Copy **Project URL** (format: `https://xxxxx.supabase.co`)
3. Copy **Anon Key** (under `anon [public]`)

#### Create `.env.local`
```bash
cp .env.local.template .env.local
```

Edit `.env.local` and paste your credentials:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Run Database Migrations

#### Via Supabase Dashboard
1. Go to **SQL Editor**
2. Click **New Query**
3. Copy & paste content from each migration file:
   - `supabase/migrations/001_create_settings_table.sql`
   - `supabase/migrations/002_create_portfolios_table.sql`
   - `supabase/migrations/003_create_campaigns_and_assets.sql`
   - `supabase/migrations/004_add_tier_system.sql`
   - `supabase/migrations/005_create_notes_and_activity.sql`
4. Click **RUN** for each
5. Verify tables appear in **Table Editor**

**Expected tables after migrations:**
```
- user_settings
- portfolios
- campaigns
- portfolio_leads
- portfolio_assets
- portfolio_notes
- activity_log
- offline_queue
- teams
```

#### Via Supabase CLI (Alternative)
```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

### 3. Test Supabase Connection
```bash
npm run dev
# Open browser console (F12)
# Should see: "Supabase client initialized"
```

---

## Priority 2: Error Handling & Offline Support ✅

### Features Implemented

#### Hybrid Storage Layer
- `services/hybridStorageService.ts`
- Automatic sync to Supabase when online
- Offline queue for operations while disconnected
- Conflict resolution (last-write-wins)

**Usage:**
```typescript
import { hybridStorage } from './services/hybridStorageService';

// Save portfolio (syncs to Supabase if online)
const portfolio = await hybridStorage.savePortfolio(data);

// Load portfolios (falls back to localStorage if offline)
const portfolios = await hybridStorage.loadPortfolios();

// Get sync status
const status = hybridStorage.getSyncStatus();
// { isOnline: boolean, queuedOperations: number, syncing: boolean }
```

#### Error Handling Service
- `services/errorHandlingService.ts`
- Centralized error logging
- User-friendly error messages
- Critical error persistence
- Global error handlers (uncaught exceptions, unhandled rejections)

**Usage:**
```typescript
import { errorHandler } from './services/errorHandlingService';

// Log various error types
errorHandler.logError('CODE', 'message', 'error');
errorHandler.logNetworkError('Network failed');
errorHandler.logSyncError('Data sync failed');
errorHandler.logValidationError('Invalid input');

// Subscribe to errors
errorHandler.onError((error) => {
    // Show toast/notification
    showNotification(errorHandler.getUserFriendlyMessage(error));
});

// Get error history
const errors = errorHandler.getErrorHistory(10);
```

#### Validation Service
- `services/validationService.ts`
- Data validation for portfolios, campaigns, leads
- Email, URL, phone validation
- XSS prevention (string sanitization)
- Detailed validation error reporting

**Usage:**
```typescript
import { validator } from './services/validationService';

// Validate and report
const errors = validator.validateAndReport(data, 'portfolio');
if (errors.length > 0) {
    // Handle validation errors
}

// Specific validators
validator.isValidEmail('user@example.com');
validator.isValidUrl('https://example.com');
validator.sanitizeString(userInput);
```

#### Authentication Service
- `services/authService.ts`
- Supabase auth integration
- Anonymous user fallback
- User tier system
- Auth state management

**Usage:**
```typescript
import { authService } from './services/authService';

// Get current user
const user = authService.getCurrentUser();

// Sign up / Sign in / Sign out
const { user, error } = await authService.signUp(email, password);
await authService.signOut();

// Check authentication
if (authService.isAuthenticated()) {
    // User is logged in
}

// Subscribe to auth changes
authService.onAuthChange((user) => {
    // Update UI
});
```

---

## Priority 3: End-to-End Testing ✅

### Test Flow: Create → Save → Reload → Verify

#### Test 1: Anonymous User (No Auth)
```bash
npm run dev
# Open http://localhost:5173

# Open DevTools Console (F12)

# 1. Check user
JSON.parse(localStorage.getItem('_current_user'))
// Should show: { id: 'anon_...', isAnonymous: true }

# 2. Create portfolio
// User creates portfolio through UI

# 3. Verify localStorage
JSON.parse(localStorage.getItem('core_dna_portfolios'))
// Should show portfolio in array

# 4. Refresh page
location.reload()

# 5. Verify portfolio persists
JSON.parse(localStorage.getItem('core_dna_portfolios'))
// Portfolio should still be there
```

#### Test 2: With Supabase (Authenticated User)
```bash
# Prerequisite: Supabase project set up, .env.local configured

# 1. Go to Settings page
# 2. Create account or sign in (if auth UI added)
# 3. Create portfolio

# 4. Check Supabase
# - Go to Supabase dashboard > SQL Editor
# - Run: SELECT * FROM portfolios;
# - Should see portfolio record

# 5. Refresh page
location.reload()

# 6. Verify sync
# - Portfolio loads from Supabase
# - localStorage and Supabase match
```

#### Test 3: Offline Sync
```bash
# 1. Open DevTools > Network tab
# 2. Set to Offline mode
# 3. Create/edit portfolio
# 4. Check: hybridStorage.getSyncStatus()
# 5. Turn network back on
# 6. Should auto-sync
# 7. Verify in Supabase console
```

#### Test 4: Error Scenarios
```bash
# Wrong Supabase credentials
# Expected: Falls back to localStorage, logs error

# Missing .env.local
# Expected: Error on load, check console

# Quota exceeded
# Expected: Warning modal, operations queued

# Network timeout (slow 4G)
# Expected: Error message, local save succeeds
```

---

## Verification Checklist

### Setup
- [ ] Supabase project created
- [ ] Credentials in `.env.local`
- [ ] Migrations run successfully
- [ ] `npm run dev` shows "Supabase client initialized"

### Functionality
- [ ] Anonymous user created on first visit
- [ ] Portfolio creates locally
- [ ] Portfolio appears in Supabase DB
- [ ] Portfolio persists after refresh
- [ ] Offline queue tracks changes while offline
- [ ] Changes sync when back online

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Validation errors caught before save
- [ ] Quota warning appears
- [ ] Offline queue prevents data loss

### Performance
- [ ] Create portfolio < 2s
- [ ] Load portfolios < 1s
- [ ] No UI freezing during save
- [ ] Sync in background (non-blocking)

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server: `npm run dev`

### Portfolio doesn't save to Supabase
- Check network tab: is request going out?
- Verify RLS policies in Supabase
- Check error logs: `errorHandler.getErrorHistory()`
- Ensure user_id matches in policies

### Offline queue not syncing
- Check `hybridStorage.getSyncStatus()` in console
- Verify network is actually online
- Check error logs for sync errors
- Try manual sync: Refresh page

### "Table does not exist" error
- Verify all 5 migrations ran successfully
- Check Supabase Table Editor for tables
- Re-run migrations if missing

### Anonymous user keeps changing
- Should be consistent (stored in localStorage)
- Check: `localStorage.getItem('_anonymous_user_id')`
- Clear localStorage if corrupted: `localStorage.clear()`

---

## Next Steps (Post-Deployment)

1. **Add Auth UI**
   - Sign up / Sign in / Sign out pages
   - Integration with authService
   - Remember me functionality

2. **Add Real-time Sync**
   - Supabase Realtime subscriptions
   - Live updates across devices
   - Presence indicators

3. **Add Notifications**
   - Toast service
   - Error notifications
   - Success confirmations

4. **Add Data Export**
   - Export portfolio as PDF
   - Backup to JSON
   - Import from JSON

5. **Add Usage Tracking**
   - Activity log viewing
   - Tier-based limits
   - Usage analytics

---

## Deployment (Production)

### Build
```bash
npm run build
# Creates dist/ folder
```

### Deploy Options
1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**
   ```bash
   npm run build
   # Drag dist/ to Netlify
   ```

3. **Firebase**
   ```bash
   npm install -g firebase-tools
   firebase deploy
   ```

---

## Support & Debugging

### Check Supabase Connection
```typescript
import { supabase } from './services/supabaseClient';

// Test auth
const { data } = await supabase.auth.getSession();
console.log('Session:', data);

// Test RLS
const { data, error } = await supabase
    .from('portfolios')
    .select('*');
console.log('Query result:', { data, error });
```

### View Error Logs
```javascript
// In browser console
import { errorHandler } from './services/errorHandlingService';
errorHandler.getErrorHistory(20);
errorHandler.getCriticalErrors();
```

### Clear All Data
```javascript
localStorage.clear(); // Clear browser storage
// Then refresh page to reset
```
