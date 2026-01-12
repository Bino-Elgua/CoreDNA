# Campaign Image Generation Fix

## Problem
Campaigns were generating asset text (headlines, copy, CTAs, and image prompts) but **not actually generating images**. The `imageUrl` field was always empty.

## Root Cause
In `autonomousCampaignService.ts`, the `generateStoryAssets()` function was:
1. Calling `generateCampaignAssets()` to create asset metadata
2. Mapping the response to `CampaignAsset` objects
3. **BUT** never calling `generateAssetImage()` to actually generate images from the prompts

The import statement for `generateAssetImage` existed but the function was unused.

## Solution

### 1. Added Image Generation to Asset Generation
Modified `services/autonomousCampaignService.ts`:
- Wrapped asset mapping in `Promise.all()` to handle async image generation
- Call `generateAssetImage(asset.imagePrompt, dna.visualStyle?.description)` for each asset
- Gracefully handle image generation failures without failing entire story
- Populate `imageUrl` field with generated image or placeholder

```typescript
// Generate images for each asset
const assetsWithImages = await Promise.all(
  response.map(async (asset: any, idx: number) => {
    let imageUrl = '';
    try {
      if (asset.imagePrompt) {
        imageUrl = await generateAssetImage(asset.imagePrompt, dna.visualStyle?.description || 'Modern');
      }
    } catch (imgError: any) {
      console.warn(`Image generation failed for asset ${idx}: ${imgError.message}`);
      // Continue without image - don't fail the entire story
    }
    return { ...asset, imageUrl };
  })
);
```

### 2. Improved Image Generation Fallback
Modified `services/geminiService.ts` in `generateAssetImage()`:
- Changed from throwing errors to graceful fallback with placeholder images
- If no image provider configured → use placeholder (not error)
- If provider has no API key → use placeholder (not error)
- If provider API call fails → use placeholder (not error)
- Campaigns can now complete even without image generation configured

```typescript
if (!provider) {
  console.warn('[generateAssetImage] No image provider configured, using placeholder');
  return `https://via.placeholder.com/1024x1024?text=...`;
}

if (!config?.apiKey) {
  console.warn(`[generateAssetImage] No API key for ${provider}, using placeholder`);
  return `https://via.placeholder.com/1024x1024?text=...`;
}
```

## Result
✅ Campaigns now produce images automatically:
- Text LLM generates asset copy & image prompts
- Image generation is called for each asset
- Falls back to placeholder if no provider configured
- Campaign execution doesn't break due to image generation errors

## Setup

### Option 1: With Image Provider (Recommended)
1. Go to Settings → API Keys
2. Add an image provider (Stability AI, DALL-E, Flux, etc.)
3. Paste API key
4. Select as "Active Image Provider"
5. Run campaign → images will be generated

### Option 2: Without Image Provider
1. Run campaign as normal
2. Images will use placeholder URLs
3. Later add image provider to upgrade

## Testing

```bash
npm run dev
# 1. Create brand DNA
# 2. Create campaign → click "Generate PRD"
# 3. Start Autonomous Mode
# 4. Watch console for:
#    - "Generating image 1/2 for..."
#    - "✓ Image generated for..."
# 5. Check Assets Preview for populated imageUrl
```

## Files Modified
- `services/autonomousCampaignService.ts` - Added image generation loop
- `services/geminiService.ts` - Added graceful fallback handling

## Backward Compatibility
✅ Existing campaigns unaffected
✅ No breaking changes to API
✅ Falls back gracefully if image provider not configured
