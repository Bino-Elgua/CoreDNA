# CoreDNA2 API Issue: Duplicate Keys in PROVIDER_META

## Problem Identified

The `SettingsPage.tsx` file contained **3 duplicate keys** in the `PROVIDER_META` configuration object, causing Vite build warnings and potential runtime issues.

### Duplicates Found:

1. **`wan`** (line 204 and 248)
   - Line 204 (Image): `{ title: 'Wan', icon: '🌊', ... getKeyUrl: 'https://wan.ai/' }`
   - Line 248 (Video): `{ title: 'Wan 2.6', icon: '🌊', ... getKeyUrl: 'https://replicate.com/' }`
   - **Resolution**: Renamed video version to `wan_video`

2. **`hunyuan`** (line 175 and 249)
   - Line 175 (LLM): `{ title: 'Hunyuan', icon: '🌤️', ... }`
   - Line 249 (Video): `{ title: 'HunyuanVideo', icon: '🎯', ... }`
   - **Resolution**: Renamed video version to `hunyuan_video`

3. **`replicate`** (line 198 and 260)
   - Line 198 (Image): `{ title: 'Replicate', icon: '🔁', ... getKeyUrl: 'https://replicate.com/account/api-tokens' }`
   - Line 260 (Video): `{ title: 'Replicate (Multi)', icon: '🔄', ... getKeyUrl: 'https://replicate.com/api' }`
   - **Resolution**: Renamed video version to `replicate_video`

## Build Errors Before Fix

```
12:51:37 PM [vite] (client) warning: Duplicate key "wan" in object literal
12:51:37 PM [vite] (client) warning: Duplicate key "hunyuan" in object literal
12:51:37 PM [vite] (client) warning: Duplicate key "replicate" in object literal
```

## Changes Made

### 1. Updated PROVIDER_META Object (lines 241-263)
- Renamed `wan` → `wan_video` in the video section
- Renamed `hunyuan` → `hunyuan_video` in the video section
- Renamed `replicate` → `replicate_video` in the video section

### 2. Updated INITIAL_SETTINGS.video Object (lines 109-132)
- Renamed `wan: { provider: 'wan', ... }` → `wan_video: { provider: 'wan_video', ... }`
- Renamed `hunyuan: { provider: 'hunyuan', ... }` → `hunyuan_video: { provider: 'hunyuan_video', ... }`
- Renamed `replicate: { provider: 'replicate', ... }` → `replicate_video: { provider: 'replicate_video', ... }`

## Build Status

### Before Fix:
```
[vite] (client) warning: Duplicate key "wan" in object literal
[vite] (client) warning: Duplicate key "hunyuan" in object literal
[vite] (client) warning: Duplicate key "replicate" in object literal
```

### After Fix:
```
✓ 1397 modules transformed.
✓ built in 9.89s
```

**Status**: ✅ Build successful with no warnings

## Related Issues

This fix addresses the **API configuration issues** documented in `API_CONFIGURATION_ISSUES_AND_FIXES.md`. The duplicate keys were preventing proper provider configuration and could have caused:
- Incorrect provider metadata being used at runtime
- Settings not being properly saved/loaded for affected providers
- Provider selection logic breaking for video providers with conflicting names

## Testing

After fix, verify:
- [ ] Settings page loads without console errors
- [ ] Video providers display correctly
- [ ] Video provider metadata shows correct titles/icons
- [ ] Provider selection works for wan_video, hunyuan_video, replicate_video
- [ ] No Vite warnings during dev server startup

## Files Modified

- `pages/SettingsPage.tsx` (2 changes)
  - PROVIDER_META object (3 renamed entries)
  - INITIAL_SETTINGS.video object (3 renamed entries)
