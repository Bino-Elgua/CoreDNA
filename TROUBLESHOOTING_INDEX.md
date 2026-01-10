# CoreDNA2 Troubleshooting Index

## Problem: "Add an API Key" Error

**Symptom**: App says to add API key, but you already did

**Quick Solution**: See `QUICK_FIX.txt` (5-10 minutes)

**Detailed Solution**: See `SETTINGS_SAVE_GUIDE.md` (step-by-step)

**Advanced Debugging**: See `CONSOLE_DIAGNOSTICS.md` (copy-paste commands)

---

## Related Issues

### Build Issues
**File**: `DUPLICATE_KEY_FIX.md`
- Vite duplicate key warnings
- Provider name conflicts
- Build errors

### Provider Configuration
**File**: `PROVIDER_CATEGORIZATION_AUDIT.md`
- Which provider goes where
- Provider routing
- Feature-to-provider mapping

### System Status
**File**: `COREDNA2_STATUS.md`
- Current build status
- Provider inventory
- Known limitations
- System requirements

---

## Documentation Quick Links

### For Different Users

**I'm in a hurry** → Read: `QUICK_FIX.txt` (5 min)

**I want step-by-step** → Read: `SETTINGS_SAVE_GUIDE.md` (10 min)

**I want to debug myself** → Read: `CONSOLE_DIAGNOSTICS.md` + commands (15 min)

**I need to understand the system** → Read: `FIX_COMPLETE_REPORT.md` (20 min)

**I'm a developer** → Read: `PROVIDER_CATEGORIZATION_AUDIT.md` (15 min)

---

## Three Levels of Help

### Level 1: Quick Fix (If you're busy)
**File**: `QUICK_FIX.txt`
- 5 quick fixes to try
- Should solve 95% of cases
- Copy-paste commands included

### Level 2: Detailed Guide (If you want to understand)
**File**: `SETTINGS_SAVE_GUIDE.md`
- Complete step-by-step
- Shows exact procedure
- Verification checklist
- Common mistakes listed

### Level 3: Debugging (If you want technical details)
**File**: `CONSOLE_DIAGNOSTICS.md`
- Browser console commands
- What each command shows
- Troubleshooting matrix
- How system actually works

---

## File List & Purpose

| File | Purpose | Read Time |
|------|---------|-----------|
| `QUICK_FIX.txt` | Fast troubleshooting | 5 min |
| `SETTINGS_SAVE_GUIDE.md` | Step-by-step setup | 10 min |
| `CONSOLE_DIAGNOSTICS.md` | Advanced debugging | 15 min |
| `DEBUG_SETTINGS.md` | How debugging works | 10 min |
| `FIX_COMPLETE_REPORT.md` | Full technical report | 20 min |
| `DUPLICATE_KEY_FIX.md` | Build issues fixed | 10 min |
| `PROVIDER_CATEGORIZATION_AUDIT.md` | Provider details | 15 min |
| `COREDNA2_STATUS.md` | System status | 10 min |
| `API_PROVIDER_FIX_SUMMARY.md` | What was fixed | 10 min |
| `API_FIX_INDEX.md` | Master index | 5 min |

---

## Common Issues & Solutions

### Issue: "No API key configured"
**Cause**: Settings weren't saved to browser storage
**Quick Fix**: See FIX #1-2 in `QUICK_FIX.txt`
**Detailed Fix**: See "Step 5: Verify It Saved" in `SETTINGS_SAVE_GUIDE.md`

### Issue: "Provider not found"
**Cause**: Provider name mismatch or not enabled
**Quick Fix**: See FIX #3 in `QUICK_FIX.txt`
**Detailed Fix**: Use command #2 in `CONSOLE_DIAGNOSTICS.md`

### Issue: Settings keep resetting
**Cause**: Auto-save not completing before navigation
**Quick Fix**: Wait 3+ seconds after typing, then click Save
**Detailed Fix**: See "The Exact Flow" in `SETTINGS_SAVE_GUIDE.md`

### Issue: Build warnings
**Cause**: Duplicate provider keys (FIXED)
**See**: `DUPLICATE_KEY_FIX.md`

### Issue: Wrong provider being used
**Cause**: `activeLLM` not set or mismatched
**Quick Fix**: See FIX #3 in `QUICK_FIX.txt`
**Debug**: Use command #6 in `CONSOLE_DIAGNOSTICS.md`

---

## Verification Checklist

Before troubleshooting, verify you have:

- [ ] Settings page opens without errors
- [ ] LLM tab is visible
- [ ] Provider dropdown shows options
- [ ] You can type in API Key field
- [ ] Browser console (F12) doesn't show errors
- [ ] You waited 3+ seconds after pasting key

If any of above fails, do FIX #4 (Hard Refresh) or FIX #5 (Reset).

---

## How to Report Issues

If the quick fixes don't work, provide:

1. **Browser**: Chrome/Firefox/Safari/Edge?
2. **OS**: Windows/Mac/Linux?
3. **Console output**: From `CONSOLE_DIAGNOSTICS.md` command #1
4. **Steps you took**: Which FIX numbers did you try?
5. **What you see**: Full error message?
6. **What you expected**: What should happen?

---

## Related Files (Not Troubleshooting)

### Architecture
- `COREDNA2_STATUS.md` - System overview

### Provider Details
- `PROVIDER_CATEGORIZATION_AUDIT.md` - 135 providers listed
- `API_PROVIDER_FIX_SUMMARY.md` - Provider routing

### Build Status
- `DUPLICATE_KEY_FIX.md` - What was fixed
- `FIX_COMPLETE_REPORT.md` - Complete audit

---

## Key Concepts

### What is Auto-Save?
After you type/paste an API key:
1. `updateProvider()` updates React state
2. `setHasChanges(true)` is triggered  
3. Effect waits 2 seconds
4. `saveSettings()` is called
5. localStorage gets updated
6. "Settings auto-saved" message appears

**Important**: You must WAIT those 2 seconds or click Save

### What is `getActiveLLMProvider()`?
Function that finds which LLM to use:
1. Checks `activeLLM` from settings + has API key?
2. If no, finds first provider with non-empty API key
3. If neither, throws error

**Problem** happens at step 2 - no provider has API key

### What is localStorage?
Browser storage (like a notepad in your browser):
- Stored locally on your computer
- Survives page refresh
- One "book" per site
- We use key: `core_dna_settings`

API keys should always be here (never sent to server).

---

## When to Use Each Document

| Situation | Document |
|-----------|----------|
| In a hurry | QUICK_FIX.txt |
| Following steps | SETTINGS_SAVE_GUIDE.md |
| Debugging | CONSOLE_DIAGNOSTICS.md |
| Learning system | FIX_COMPLETE_REPORT.md |
| Understanding providers | PROVIDER_CATEGORIZATION_AUDIT.md |
| Understanding fix | DUPLICATE_KEY_FIX.md |
| System overview | COREDNA2_STATUS.md |

---

**Status**: ✅ Ready to troubleshoot
**Last Updated**: January 9, 2025
