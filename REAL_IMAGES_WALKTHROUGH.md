# Real Images Walkthrough - Complete Setup

The image generation is **fully implemented**. If you're not seeing real images, it's because **no API keys are configured**. 

Here's the complete setup:

---

## Step 1: Configure Image Provider

1. Open CoreDNA2 app (http://localhost:3000)
2. Click **Settings** (gear icon)
3. Go to **API Keys** tab
4. Under **Image Providers**, find a provider:
   - `dalle` - OpenAI DALL-E 3
   - `stability` - Stability AI  
   - `fal_flux` - Flux AI
   - `ideogram` - Ideogram
   - Others...

5. Click **Add Key** or edit the provider
6. Paste your API key
7. Make sure it's marked as **Active** (toggle/radio button)
8. Click **Save Settings**

### Where to Get Keys

**DALL-E 3** (OpenAI):
- Go to https://platform.openai.com/api-keys
- Create new API key
- Paste into settings

**Stability AI**:
- Go to https://platform.stability.ai  
- Get API key from account
- Paste into settings
- Note: API key is in format `sk-xxxx`

**Replicate** (Flux):
- Go to https://replicate.com/account/api-tokens
- Copy API token
- Paste into settings

---

## Step 2: Configure LLM Provider

Campaigns also need an LLM to generate the copy/text. Without it, PRD generation fails.

1. In Settings → **API Keys** tab
2. Under **Language Models**, add at least one:
   - `openai` - OpenAI GPT-4o (recommended)
   - `anthropic` - Claude 3.5
   - `groq` - Free tier available
   - Others...

3. Click **Add Key**
4. Paste API key
5. Mark as **Active**
6. Click **Save**

### Where to Get Keys

**OpenAI** (cheapest for small campaigns):
- https://platform.openai.com/api-keys
- $0.03-0.15 per campaign generation

**Groq** (FREE):
- https://console.groq.com/keys
- Free tier: 1,000 tokens/min
- Perfect for testing

**Anthropic Claude** (best quality):
- https://console.anthropic.com/
- More expensive but better outputs

---

## Step 3: Create Campaign with Real Images

1. Go to **Campaigns** page
2. Click **Create Campaign** button
3. In modal, click **Generate PRD**
4. Fill out the form:
   - Campaign Goal: "Launch eco-friendly product line"
   - Target Audience: "Environmentally conscious millennials"
   - Channels: Instagram, LinkedIn, Email
   - Timeline: "30 days"
5. Click **Generate PRD**

### What Happens Now (With Real Images)

Progress shows:
```
Analyzing campaign brief...
✓ Parsing PRD structure...
✓ Validating PRD...
Generating campaign asset images...
Generating image for: Create Instagram post design...
Generating image for: Create LinkedIn carousel...
[... continues ...]
✓ Completed. Generated 5 images
```

You'll see real images from your configured provider.

### What Happens (Without Images)

If no provider configured:
```
Analyzing campaign brief...
✓ PRD generated with 8 user stories
Generating campaign asset images...
[generateImage] Falling back to placeholder
[generateImage] Falling back to placeholder
[... continues ...]
```

You'll see `https://via.placeholder.com/...` URLs instead of real images.

---

## Step 4: View Generated Campaign

1. PRD appears with user stories
2. Click **Use This PRD** 
3. Campaign dashboard shows stories with:
   - ✓ Real copy (from LLM)
   - ✓ Real images (from image provider)
   - Optional: Real videos (if video provider configured)

---

## Complete Minimal Setup (Free)

To test with no cost:

### Image Generation
**Groq** + **Replicate Flux** (both free tiers):

1. **Groq**:
   - Go to https://console.groq.com/keys
   - Create API key (free tier)
   - Copy key

2. **Replicate**:
   - Go to https://replicate.com/account/api-tokens  
   - Copy API token
   - Get $50 free credit

### LLM
**Groq** (same as above, free):
- One API key handles both LLM + image inference

### Setup in Settings:
```
API Keys:

Language Models:
☑ groq: [paste groq api key]
☑ Active: groq

Image Providers:
☑ replicate: [paste replicate api token]  
☑ Active: replicate
```

**Cost**: $0 (fully free tier)
**Limitation**: Groq free tier is 1000 tokens/min (enough for 1-2 campaigns/min)

---

## Setup for Production (Recommended)

### Image Generation
**OpenAI DALL-E 3** (~$0.080 per image):
- https://platform.openai.com/api-keys
- Cost: ~$0.40 per 5-image campaign

### LLM  
**Groq** (free tier):
- https://console.groq.com/keys
- Cost: $0/month (if under 1000 tokens/min)

### Video (Optional)
**Luma** (~$0.75 per video):
- https://lumalabs.ai
- Or use free tiers of other providers

### Total Cost
- LLM: $0 (Groq free)
- Images: ~$0.40 per campaign
- Videos: $0.75 per campaign
- **~$1.15 per full campaign** (copy + 5 images + 1 video)

---

## Troubleshooting

### "No image generation provider configured"
- Go to Settings → API Keys → Image Providers
- Make sure one is set as Active with an API key

### "No LLM provider configured"  
- Go to Settings → API Keys → Language Models
- Make sure one is set as Active with an API key

### "DALL-E API error: 401"
- Your API key is wrong or expired
- Get fresh key from https://platform.openai.com/api-keys

### "Request failed: 429"
- You've hit API rate limit
- Wait a moment and try again
- Or upgrade plan with your provider

### Images are placeholders but no error shown
- Open browser console (F12)
- Look for errors about API key configuration
- Check Settings are actually saved

---

## Verify Setup Works

**Test in Browser Console:**

```javascript
// Check config
const s = JSON.parse(localStorage.getItem('core_dna_settings'));
console.log('Image provider:', s.activeImageGen);
console.log('LLM provider:', s.activeLLM);
console.log('Image keys:', Object.keys(s.image || {}).filter(k => s.image[k]?.apiKey));
console.log('LLM keys:', Object.keys(s.llms || {}).filter(k => s.llms[k]?.apiKey));

// All 4 should show at least 1 result each
```

---

## Next: Autonomous Execution

Once campaigns generate with real images, you can:

1. Review PRD (copy + images look good?)
2. Click **Execute Campaign**
3. System automatically:
   - Refines assets through iteration cycles
   - Regenerates images based on feedback
   - Validates quality
   - Marks complete when all pass

Result: **Production-ready campaign assets** ready to post.

---

## Still Need Help?

Check:
- `DEBUG_MEDIA_GENERATION.md` - Debugging guide
- `MEDIA_GENERATION_INTEGRATION.md` - Technical details
- Browser console (F12) - See actual errors
