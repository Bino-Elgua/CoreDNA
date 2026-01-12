# Campaign & Autonomous Mode Setup Requirements

## REQUIRED: API Keys

The autonomous campaign feature requires at least **ONE LLM provider configured** with a valid API key.

### Supported LLM Providers:
- OpenAI (GPT-4o recommended)
- Claude (Anthropic)
- Gemini (Google)
- Mistral
- Groq
- DeepSeek
- X.AI (Grok)
- Qwen
- Cohere
- Perplexity
- OpenRouter
- Together AI
- Local Ollama (localhost:11434)

### How to Configure:
1. Go to **Settings** → **API Keys** tab
2. Select an LLM provider
3. Paste your API key
4. **Mark it as Active** (use the toggle/button)
5. Save settings

### No API Key Configured?
If you see: *"Error: No LLM provider configured. Go to Settings → API Keys."*

**You MUST add at least one LLM provider before running campaigns.**

---

## Campaign Execution Flow

### 1. Generate PRD (Product Requirements Document)
- Click **📋 PRD** button in Campaign Suite
- Fill in campaign details (goal, audience, channels, timeline)
- Click **Generate PRD**
- Review the generated user stories

### 2. Run Autonomous Mode
- After PRD generation, **Autonomous Campaign Mode** opens automatically
- Choose execution mode:
  - **🚀 Full Autonomous**: AI executes all stories automatically
  - **👣 Step-by-Step**: Execute one story at a time

### 3. Execution Process
For each user story:
1. **Generate Assets** (copy, headlines, CTAs, image prompts)
2. **Validate** against acceptance criteria
3. **Mark Complete** if validation passes
4. **Retry** if validation fails (up to max iterations)

---

## What Gets Generated

### Assets per Story:
- Social media posts (Instagram, LinkedIn, Twitter, TikTok)
- Email campaign content
- Copy headlines & CTAs
- Image generation prompts (optional with DALL-E/Stability)
- Web/landing page copy

### Quality Checks:
- Brand voice consistency
- Message alignment
- Acceptance criteria validation
- Asset completeness

---

## Troubleshooting

### "Campaign glitches back to dashboard"
**Root Cause**: Likely an error during execution (missing API key, malformed response)

**Fix**:
1. Check browser console (F12 → Console tab)
2. Look for error messages in the modal
3. Verify LLM API key is configured and active in Settings
4. Try clicking **"Back to Settings"** button
5. Re-check API key validity

### "No LLM provider configured"
Go to Settings → API Keys and add at least one provider with a valid key.

### "Validation failed for story"
The generated assets didn't meet acceptance criteria. Try:
1. Run the story again (up to max iterations)
2. Check that your brand DNA is properly configured
3. Ensure campaign goal is clear and specific

### "Assets not generating"
1. Verify your LLM API key has credits/quota
2. Check internet connection
3. Try a different LLM provider

---

## API Key Sources

### Free/Generous Tier:
- **Groq**: Free API key (very fast, generous limits)
- **Ollama**: Completely free, runs locally
- **OpenRouter**: $5-10 free credits to start

### Paid (usually cheapest for this use):
- **OpenAI**: $0.15/1M tokens for GPT-4o Mini
- **Claude**: Similar pricing
- **Mistral**: Competitive pricing

### Recommendation:
Start with **Groq** (free, very fast) or **Ollama** (completely free, runs locally).

---

## Current Implementation Status

✅ Campaign PRD Generation
✅ Autonomous story execution
✅ Asset generation  
✅ Validation loop
✅ Error handling & display
⏳ Image generation (optional)
⏳ Video generation (pro tier)

---

## File Reference

- **Component**: `components/AutonomousCampaignMode.tsx`
- **Campaign Service**: `services/campaignPRDService.ts`
- **Execution Service**: `services/autonomousCampaignService.ts`
- **LLM Config**: `services/geminiService.ts`

