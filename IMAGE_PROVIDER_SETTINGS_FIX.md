# Image Provider Settings Fix

## Problem
After changing the active image provider in Settings and clicking Save, the change wasn't being applied. Campaigns would still use the old (or default) provider even after selecting a different one.

## Root Cause
`generateAssetImage()` was reading `localStorage` once when the module loaded, but the **Settings page** was updating state locally before persisting. The timing looked like:

1. User selects new image provider in Settings
2. State updates in component
3. User clicks Save
4. `saveSettings()` saves to localStorage
5. But `generateAssetImage` was using cached/stale values if called before new values propagated

## Solution

### 1. Force Fresh localStorage Read Every Time
Modified `services/geminiService.ts` in `generateAssetImage()`:
- Removed any potential caching
- Read `localStorage.getItem('core_dna_settings')` **every time the function is called**
- Added debug logging to confirm which provider is being used
- Wrapped entire function in try-catch for robustness

```typescript
// ALWAYS read fresh from localStorage to get latest settings
const settingsStr = localStorage.getItem('core_dna_settings');
const settings = JSON.parse(settingsStr);
const provider = settings.activeImageGen;

console.log(`[generateAssetImage] Using provider: ${provider}`);
```

### 2. Added Defensive Checks
- Check if localStorage even exists before parsing
- Verify provider is set and has API key
- Gracefully fall back to placeholder for any failure scenario
- Added outer try-catch for unexpected errors

## Result
✅ Image provider selection is now immediate and persistent:
- Change provider in Settings
- Click Save
- Run campaign immediately → uses new provider
- Console shows `[generateAssetImage] Using provider: [your choice]`

## Self-Healing Panel AI
**Self-healing uses Sonic Co-Pilot (`sonicChat`)** for validation and regeneration, not an image generation provider.

The self-healing flow:
1. Validates asset against brand via Sonic
2. Gets issues/suggestions from Sonic
3. Regenerates copy/cta via Sonic
4. Regenerates image using **activeImageGen** (same as campaigns)

## Testing

```bash
npm run dev

# 1. Go to Settings → Image tab
# 2. Select a provider (e.g., Stability AI, DALL-E 3)
# 3. Add API key
# 4. Click Save
# 5. Open browser console (F12)
# 6. Create campaign → Generate PRD → Start Autonomous
# 7. Watch console for:
#    - "[generateAssetImage] Using provider: stability"
#    - "[generateAssetImage] ✓ Image generated..."
# 8. Check that images actually appear in assets
```

## Debug Checklist

If images still aren't appearing:

1. **Check browser console for logs**
   - Look for `[generateAssetImage] Using provider: X`
   - Should match your selected provider

2. **Verify localStorage has settings**
   - Open DevTools → Application → LocalStorage
   - Look for `core_dna_settings`
   - Check `activeImageGen` field

3. **Verify API key is saved**
   - In same localStorage entry, check `image[provider].apiKey`
   - Should have actual API key value

4. **Test placeholder URLs work**
   - Even if API fails, should see via.placeholder.com images
   - If these don't appear, check browser console for errors

5. **Clear cache and reload**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Clear browser cache
   - Try again

## Files Modified
- `services/geminiService.ts` - Added fresh localStorage reads, logging, error handling

## Backward Compatibility
✅ No breaking changes
✅ Falls back gracefully to placeholders
✅ Existing campaigns unaffected
✅ Works with or without provider configured
