# CoreDNA2 - Supabase Setup Manual
**Complete SQL & Installation Guide**

---

## TABLE OF CONTENTS
1. [Prerequisites](#prerequisites)
2. [Supabase Account Setup](#supabase-account-setup)
3. [SQL Migrations](#sql-migrations)
4. [Environment Variables](#environment-variables)
5. [Verification Checklist](#verification-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you need:
- ✅ Supabase account (free at https://supabase.com)
- ✅ CoreDNA2 code downloaded
- ✅ npm/yarn installed locally
- ✅ Text editor for `.env.local`

**Estimated time:** 15-20 minutes

---

## Supabase Account Setup

### Step 1: Create Supabase Project

1. Go to **https://supabase.com/dashboard**
2. Click **"New Project"**
3. Fill in:
   - **Name:** `CoreDNA2` (or your preference)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Select closest to you (or `us-east-1` for default)
   - **Pricing Plan:** Free (you can upgrade later)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Get Credentials

Once project is ready:

1. Go to **Settings** → **API** (left sidebar)
2. Copy these two values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`
3. Save them (you'll need them in Step 6)

**Important:** Never share these keys publicly. The "Anon Key" is safe for frontend use with RLS.

---

## SQL Migrations

### Step 3: Access SQL Editor

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. You'll see a blank SQL editor

### Step 4: Run Each Migration (IN ORDER)

Copy-paste each SQL block below into the SQL Editor, then click **"Run"** after each one.

---

## 📋 MIGRATION 1: User Settings Table

```sql
-- ========================================
-- MIGRATION 1: Create user_settings table
-- ========================================
-- Purpose: Store user configuration, API keys, tier info

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}',
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'hunter', 'agency')),
    usage JSONB DEFAULT '{"extractionsThisMonth": 0, "lastResetDate": "2026-01-25"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write their own settings
CREATE POLICY "Users can access their own settings"
    ON user_settings
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Allow anonymous users to access their own anonymous profile
CREATE POLICY "Allow anonymous user access"
    ON user_settings
    FOR ALL
    USING (user_id = 'anonymous_user' AND auth.uid() IS NULL)
    WITH CHECK (user_id = 'anonymous_user' AND auth.uid() IS NULL);

-- Helper function to get current user ID from JWT or session
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.uid()::text, 'anonymous_user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**✅ After running:** Check **Table Editor** → should see `user_settings` table

---

## 📋 MIGRATION 2: Portfolios Table

```sql
-- ========================================
-- MIGRATION 2: Create portfolios table
-- ========================================
-- Purpose: Store brand portfolios with their DNA

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_website TEXT,
    industry TEXT,
    brand_dna JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_settings(user_id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at DESC);

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own portfolios
CREATE POLICY "Users can access their own portfolios"
    ON portfolios
    FOR ALL
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());

-- Allow anonymous users to access their portfolios
CREATE POLICY "Anonymous users can access their portfolios"
    ON portfolios
    FOR ALL
    USING (user_id = 'anonymous_user' AND current_user_id() IS NULL)
    WITH CHECK (user_id = 'anonymous_user' AND current_user_id() IS NULL);
```

**✅ After running:** Check **Table Editor** → should see `portfolios` table

---

## 📋 MIGRATION 3: Campaigns, Leads & Assets Tables

```sql
-- ========================================
-- MIGRATION 3: Create campaigns, leads, assets
-- ========================================
-- Purpose: Store campaigns, leads, and campaign assets

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    campaign_data JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_portfolio_id ON campaigns(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access campaigns in their portfolios"
    ON campaigns FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );

-- Create portfolio_leads table
CREATE TABLE IF NOT EXISTS portfolio_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    lead_name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    lead_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_portfolio_id ON portfolio_leads(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON portfolio_leads(user_id);
ALTER TABLE portfolio_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access leads in their portfolios"
    ON portfolio_leads FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );

-- Create portfolio_assets table
CREATE TABLE IF NOT EXISTS portfolio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    asset_url TEXT,
    asset_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_portfolio_id ON portfolio_assets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON portfolio_assets(user_id);
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access assets in their portfolios"
    ON portfolio_assets FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );
```

**✅ After running:** Check **Table Editor** → should see 3 new tables

---

## 📋 MIGRATION 4: Notes & Activity Logs

```sql
-- ========================================
-- MIGRATION 4: Create notes & activity logs
-- ========================================
-- Purpose: Track portfolio notes and user activity

-- Create portfolio_notes table
CREATE TABLE IF NOT EXISTS portfolio_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'insight', 'todo', 'alert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_portfolio_id ON portfolio_notes(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON portfolio_notes(user_id);
ALTER TABLE portfolio_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access notes in their portfolios"
    ON portfolio_notes FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_portfolio_id ON activity_log(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their activity"
    ON activity_log FOR SELECT
    USING (user_id = current_user_id());

-- Create offline_queue table for sync when back online
CREATE TABLE IF NOT EXISTS offline_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_offline_user_id ON offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_status ON offline_queue(status);
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their offline queue"
    ON offline_queue FOR ALL
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());
```

**✅ After running:** Check **Table Editor** → should see 3 new tables

---

## 📋 MIGRATION 5: Tier System & Teams

```sql
-- ========================================
-- MIGRATION 5: Add tier system & teams
-- ========================================
-- Purpose: Support team management and agency tier

-- Create teams table for Agency tier
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  tier TEXT DEFAULT 'agency',
  white_label_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add team support to user_settings (if not already added)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'admin', 'member'));

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Team members can view their team"
ON teams FOR SELECT
USING (
  id IN (
    SELECT team_id FROM user_settings WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "Team owners can update their team"
ON teams FOR UPDATE
USING (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
```

**✅ After running:** Check **Table Editor** → should see `teams` table

---

## 📋 MIGRATION 6: Affiliate Hub (Optional)

```sql
-- ========================================
-- MIGRATION 6: Affiliate Hub Schema (Optional)
-- ========================================
-- Purpose: Affiliate visitor logs, DPA acceptance, opt-outs
-- NOTE: Only run if you need affiliate features

-- Affiliate visitor logs with tiered consent
CREATE TABLE IF NOT EXISTS affiliate_visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES auth.users(id),
  visitor_ip INET,
  visitor_company TEXT,
  consented_to_identification BOOLEAN DEFAULT false,
  consented_to_marketing BOOLEAN DEFAULT false,
  consented_to_sales BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  referral_converted BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partner DPA acceptance log
CREATE TABLE IF NOT EXISTS partner_dpa_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  dpa_version TEXT NOT NULL DEFAULT '1.0',
  UNIQUE(partner_id, dpa_version)
);

-- Opt-out requests
CREATE TABLE IF NOT EXISTS affiliate_opt_out_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT,
  email TEXT,
  company_name TEXT,
  visitor_ip INET,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- RLS policies
ALTER TABLE affiliate_visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own affiliate logs"
ON affiliate_visitor_logs FOR SELECT
USING (auth.uid() = partner_id);

ALTER TABLE partner_dpa_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own DPA acceptance"
ON partner_dpa_acceptance FOR SELECT
USING (auth.uid() = partner_id);

ALTER TABLE affiliate_opt_out_requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_affiliate_logs_partner ON affiliate_visitor_logs(partner_id);
CREATE INDEX idx_affiliate_logs_consent ON affiliate_visitor_logs(consent_timestamp);
CREATE INDEX idx_dpa_partner ON partner_dpa_acceptance(partner_id);
CREATE INDEX idx_opt_out_processed ON affiliate_opt_out_requests(processed);
```

**✅ After running:** Optional - only if you're using affiliate features

---

## Step 5: Verify All Tables Created

1. Go to **Table Editor** in Supabase
2. You should see these tables on the left:
   - ✅ `user_settings`
   - ✅ `portfolios`
   - ✅ `campaigns`
   - ✅ `portfolio_leads`
   - ✅ `portfolio_assets`
   - ✅ `portfolio_notes`
   - ✅ `activity_log`
   - ✅ `offline_queue`
   - ✅ `teams` (if Tier System migration ran)
   - ✅ `affiliate_visitor_logs` (if Affiliate Hub migration ran)

If all are there, congratulations! ✅ Database is ready.

---

## Environment Variables

### Step 6: Create `.env.local` File

1. In your CoreDNA2-work directory, create a file called `.env.local`

2. Add these lines (replace with YOUR values):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
- Go to Supabase Dashboard → Settings → API
- Copy **Project URL** → paste in `VITE_SUPABASE_URL`
- Copy **Anon Key** (under "anon") → paste in `VITE_SUPABASE_ANON_KEY`

### Example (DO NOT USE - these are fake):

```
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3Njk0MjI1MCwiZXhwIjoxOTkyNTE4MjUwfQ.abcdefg123456
```

### Step 7: Test Connection

1. Open terminal in CoreDNA2-work directory
2. Run:

```bash
npm install
npm run dev
```

3. Open browser at `http://localhost:3000`
4. Check browser console (F12 → Console tab)
5. Look for message: **`[App] ✓ Supabase client initialized`**

If you see this, you're connected! ✅

---

## Verification Checklist

### Database Tables ✅
- [ ] `user_settings` exists (check Table Editor)
- [ ] `portfolios` exists
- [ ] `campaigns` exists
- [ ] `portfolio_leads` exists
- [ ] `portfolio_assets` exists
- [ ] `portfolio_notes` exists
- [ ] `activity_log` exists
- [ ] `offline_queue` exists
- [ ] `teams` exists (if you ran migration 5)

### Environment Setup ✅
- [ ] `.env.local` file created
- [ ] `VITE_SUPABASE_URL` filled in
- [ ] `VITE_SUPABASE_ANON_KEY` filled in
- [ ] No API keys committed to GitHub

### Application ✅
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] Browser shows "Supabase client initialized" in console
- [ ] Can navigate through app pages
- [ ] Extract page works (create portfolio)
- [ ] Portfolios appear in dashboard

### Data Flow ✅
- [ ] Create portfolio → appears in table
- [ ] Go offline (DevTools → Network → Offline) → still works
- [ ] Go back online → "Syncing..." appears
- [ ] Portfolio stays after page refresh

---

## Troubleshooting

### Problem: "Missing environment variables"

**Solution:** Make sure `.env.local` exists in root directory with both keys:
```bash
ls -la | grep env
# Should show: .env.local
```

---

### Problem: "Supabase client not initializing"

**Solution:**
1. Check `.env.local` has correct values (no extra spaces)
2. Check browser console for actual error message
3. Verify project is running in Supabase (check dashboard)
4. Clear browser cache: `Ctrl+Shift+Del` → Clear Cookies & Site Data

---

### Problem: "RLS policy violation"

**Symptom:** Error like "new row violates row level security policy"

**Solution:**
1. The user_id in database doesn't match auth user
2. Make sure you're logged in (check AuthContext)
3. For anonymous users, ensure user_id is 'anonymous_user'

---

### Problem: "Foreign key constraint fails"

**Symptom:** Can't create campaign because portfolio doesn't exist

**Solution:**
1. Create portfolio first (Extract page)
2. Wait for it to appear in dashboard
3. Then create campaign
4. Order matters: user_settings → portfolios → campaigns

---

### Problem: "Too many requests / Rate limited"

**Symptom:** Errors after creating many portfolios quickly

**Solution:**
- Supabase free tier has rate limits
- Space out requests
- Upgrade to paid plan for higher limits
- Contact Supabase support

---

### Problem: "Can't see tables in Table Editor"

**Symptom:** Migrations ran but no tables appear

**Solution:**
1. Refresh page (F5)
2. Check SQL Editor for errors (should say "Query executed successfully")
3. Run `SELECT table_name FROM information_schema.tables;` in SQL Editor
4. If still missing, re-run the migration

---

### Problem: "Offline queue not syncing"

**Symptom:** Created portfolio offline, but didn't sync when back online

**Solution:**
1. Check browser console for errors
2. Verify internet connection
3. Check Supabase is running (not down)
4. Manual sync: Open DevTools → Console → run:
```javascript
hybridStorage.syncNow()
```

---

## Useful Supabase Features

### View Activity Logs
- Go to **SQL Editor** → New Query
- Paste:
```sql
SELECT * FROM activity_log 
ORDER BY created_at DESC 
LIMIT 20;
```

### View Offline Queue
```sql
SELECT * FROM offline_queue 
WHERE status = 'pending';
```

### Clear Test Data
```sql
DELETE FROM campaigns;
DELETE FROM portfolio_leads;
DELETE FROM portfolio_assets;
DELETE FROM portfolios;
-- user_settings stays (needed for tier system)
```

### Monitor Storage Size
- Go to **Settings** → **Database** → Check "Database Size"

### Enable Realtime (Advanced)
- Go to **Settings** → **Realtime** → Turn on for tables you need
- Then pages auto-update when data changes

---

## Next Steps After Setup

1. ✅ Supabase is running
2. ✅ All tables created
3. ✅ App connected
4. ✅ Now set up optional features:
   - Email (emailService): Add Resend or SendGrid API key
   - Social posting: Add Instagram/Twitter/LinkedIn tokens
   - Video generation: Add fal.ai API key
   - All in SettingsPage

---

## Support

If you get stuck:

1. **Check error in browser console** (F12)
2. **Check Supabase SQL Editor** for migration errors
3. **Verify `.env.local`** has correct keys
4. **Check Supabase status** at https://supabase.com/status
5. **Ask in CoreDNA2 GitHub Issues** with error message

---

## Security Reminders

⚠️ **IMPORTANT:**
- Never commit `.env.local` to GitHub
- `.gitignore` should include `.env.local` (it does by default)
- Anon Key is safe for frontend (RLS protects data)
- Never expose Service Role Key (use only on backend)
- Users can only access their own data (RLS enforces this)

---

**Setup Complete!** 🎉

Your CoreDNA2 database is now ready. Start the dev server and begin creating portfolios!

```bash
npm run dev
```

Visit `http://localhost:3000` and extract your first brand DNA.

---

**Questions?** Check COMPLETION_STATUS.md for architecture overview.
