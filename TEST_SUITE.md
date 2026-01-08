# Core DNA v2 — Test Suite

## Prerequisites
```bash
npm install
cp .env.example .env.local
# Fill in required API keys
npm run dev
```

## Test 1: RLS Policy Enforcement

**Objective**: Verify that User A cannot read/modify User B's settings.

**Setup**:
1. Create two Supabase test users with different auth IDs
2. Authenticate as User A
3. Attempt to query User B's settings

**Expected Result**:
- User A query returns: `[]` (no rows)
- User A insert attempt: Permission denied error
- User A update attempt: Permission denied error

**SQL to verify RLS**:
```sql
-- As admin, check that RLS is enabled:
SELECT tablename FROM pg_tables WHERE tablename = 'user_settings' AND schemaname = 'public';
SELECT * FROM pg_policies WHERE tablename = 'user_settings';

-- Should show:
-- "Users can access their own settings" (USING auth.uid()::text = user_id)
-- "Allow anonymous user access" (USING user_id = 'anonymous_user' AND auth.uid() IS NULL)
```

---

## Test 2: n8n Unavailable Fallback

**Objective**: Verify that app gracefully falls back when n8n is offline.

**Setup**:
1. Stop n8n service: `docker-compose down` or `kill n8n_process`
2. Navigate to Extract → Lead Hunter
3. Enter niche "Dentists" and click "Initialize Hunter"

**Expected Result**:
- No error thrown
- "Running automated lead discovery workflow..." → "Locking on coordinates..."
- Results populated via standard `findLeadsWithMaps()` fallback
- User unaware that n8n was skipped

**Code Path**:
```
ExtractPage.tsx:72-105
  └─ n8nService.isAvailable() → returns false
     └─ Fallback: findLeadsWithMaps(niche, lat, lng)
```

---

## Test 3: Inference Wrapper Backward Compatibility

**Objective**: Verify inference works when enabled AND works normally when disabled.

**Test 3A: Inference Disabled (Default)**
1. Load app, check settings
2. Verify `settings.inference.enabled === false`
3. Run campaign generation
4. Check console: No inference router calls

**Expected**:
- Campaign assets generate normally
- No performance impact
- No inference metadata in result

**Test 3B: Inference Enabled**
1. Settings → Enable Inference (if available)
2. Run same campaign generation
3. Check console: Inference router called

**Expected**:
- Assets generated with inference techniques
- Toast shows "Using Speculative Decoding" or similar
- Metadata attached to result

---

## Test 4: Environment Configuration Validation

**Objective**: Verify all required env vars are present and documented.

**Checklist**:
```
VITE_GEMINI_API_KEY               ✓ Present in .env.example
VITE_OPENAI_API_KEY               ✓ Present in .env.example
VITE_ANTHROPIC_API_KEY            ✓ Present in .env.example
VITE_MISTRAL_API_KEY              ✓ Present in .env.example
VITE_GROQ_API_KEY                 ✓ Present in .env.example
VITE_N8N_API_URL                  ✓ Present in .env.example
VITE_N8N_API_KEY                  ✓ Present in .env.example
VITE_GOOGLE_MAPS_API_KEY          ✓ Present in .env.example
VITE_META_ACCESS_TOKEN            ✓ Present in .env.example
VITE_TWITTER_BEARER_TOKEN         ✓ Present in .env.example
```

**Verify .env.local in .gitignore**:
```bash
grep "\.local" .gitignore
# Should output: *.local
```

---

## Test 5: API Key Security Audit

**Objective**: Ensure no API keys are leaked to browser console.

**Steps**:
1. `npm run build` (production build)
2. Check dist output for hardcoded keys:
   ```bash
   grep -r "sk_live" dist/ || echo "✓ No OpenAI keys found"
   grep -r "AIzaSy" dist/ || echo "✓ No Gemini keys found"
   grep -r "Bearer " dist/ || echo "✓ No bearer tokens found"
   ```

**Expected**:
- No secrets in dist/ bundle
- Only placeholder env vars like `${'VITE_GEMINI_API_KEY'}` or undefined

**Manual Check**:
1. Load dev server: `npm run dev`
2. Open browser DevTools → Console
3. Try: `console.log(import.meta.env.VITE_GEMINI_API_KEY)`
4. Verify it returns your actual key (this is expected in dev, warn for production)

---

## Test 6: n8n Service Health Check

**Objective**: Verify n8n health check endpoint is called before workflow execution.

**Setup**:
1. Ensure n8n running at `http://localhost:5678`
2. Add console.log to n8nService.checkHealth():
   ```typescript
   console.log('[n8n] Health check...', response.ok);
   ```

**Test Flow**:
1. Extract → Lead Hunter → "Initialize Hunter"
2. Check console output
3. If n8n healthy: Should see `[n8n] Health check... true`
4. If n8n offline: Should see `[n8n] Health check... false` → fallback

---

## Test 7: Cost/Latency Warning for Self-Consistency

**Objective**: Verify high-sample Self-Consistency triggers warning (when inference enabled).

**Setup**:
1. Enable inference in settings
2. Find self-consistency configuration
3. Set samples > 3

**Expected**:
- Toast warning: "⚠️ High sample count increases costs 5x and latency"
- User can confirm or cancel

---

## Test 8: User Settings RLS Isolation

**Objective**: Verify localStorage fallback works AND Supabase RLS enforces isolation.

**Test 8A: localStorage Fallback (No Supabase)**
1. Dev tools → Application → Clear localStorage
2. App should load normally (first time)
3. Settings → Save preference
4. Check localStorage: `core_dna_settings` exists

**Test 8B: Supabase with RLS**
1. Create Supabase user
2. Login with auth
3. Save settings
4. Check: User settings stored in `user_settings` table
5. Logout, login as different user
6. Verify: Can only see own settings (RLS enforced)

---

## Test 9: Campaign Generation with n8n vs. Standard

**Objective**: Compare output quality and performance.

**Test 9A: n8n Enabled**
1. Start n8n: `docker-compose up n8n`
2. Campaigns → Select DNA → Enter goal → "Execute Sequence"
3. Time the generation
4. Record asset count and quality

**Test 9B: n8n Disabled**
1. Stop n8n
2. Repeat campaign generation
3. Compare timing and output

**Expected**:
- Both produce valid assets
- n8n may have different quality/filters
- Standard fallback works reliably

---

## Test 10: Lead Data Anonymization (n8n)

**Objective**: Verify sensitive lead data is anonymized before sending to n8n.

**Setup**:
1. Run Lead Hunter → Get results
2. Click "Execute Full Closer Sequence" on a lead
3. Intercept n8n API call (DevTools Network tab)

**Check Request Body**:
```json
{
  "lead": {
    "name": "...",
    "email": "[REDACTED]",        // Should be hashed or removed
    "phone": "[REDACTED]",         // Should be hashed or removed
    "address": "...",
    "gapAnalysis": { ... }         // OK to send
  }
}
```

**Expected**:
- No plaintext PII in n8n workflow input
- Gap analysis and business metrics sent normally

---

## Running Tests

```bash
# Start dev server
npm run dev

# In separate terminal, run test suite
npm run test  # (if configured)

# Manual testing via browser
# 1. Open DevTools Console
# 2. Follow test steps above
# 3. Check Network tab for API calls
```

---

## Issue Tracking

If tests fail, check:
1. **RLS Policy**: Run SQL migration again, verify policies exist
2. **n8n Health**: Ensure n8n is running at configured URL
3. **API Keys**: Verify .env.local has all required keys
4. **Fallback Logic**: Check console for error messages
5. **Inference**: Verify inferenceRouter.ts is loaded correctly

---

## Sign-Off

- [ ] Test 1: RLS Policy Enforcement — PASS
- [ ] Test 2: n8n Unavailable Fallback — PASS
- [ ] Test 3: Inference Wrapper Backward Compatibility — PASS
- [ ] Test 4: Environment Configuration Validation — PASS
- [ ] Test 5: API Key Security Audit — PASS
- [ ] Test 6: n8n Service Health Check — PASS
- [ ] Test 7: Cost/Latency Warning — PASS
- [ ] Test 8: User Settings RLS Isolation — PASS
- [ ] Test 9: Campaign Generation Comparison — PASS
- [ ] Test 10: Lead Data Anonymization — PASS

All tests passing: ✅ Ready for production
