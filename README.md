<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Core DNA v2 — AI Brand Intelligence Platform

Comprehensive AI-powered brand analysis, competitive intelligence, and sales acceleration platform powered by **n8n automation engine** with **Recursive Language Model (RLM)** support for infinite context processing.

**Core DNA is now workflow-native** — all agents run on n8n automation engine. No manual configuration required for end users. The magic happens silently.

**Live Demo:** https://ai.studio/apps/drive/1oK7GGLdvV3E15WgVsDL3I3M486CfJT2u

## Features

### Core Intelligence
- **Brand DNA Extraction** — Analyze websites and extract complete brand identity (mission, tone, visual DNA, personas)
- **Competitive Battle Mode** — Head-to-head strategic simulation with radar analytics and gap analysis
- **Lead Hunter** — Geo-targeted business discovery with gap analysis and social intelligence
- **Closer Agent** — AI-driven sales strategy with personalized outreach sequences, portfolio generation, and tiered pricing

### n8n Automation Engine (Workflow-Native)
All core features are powered by pre-built n8n workflows:
- **Lead Generation** — Scrape niches, filter by consistency, auto-discovery
- **Closer Agent Swarm** — Researcher → Writer → Closer → Email outreach
- **Campaign Generation** — DNA → Prompt LLM → Generate posts/banners/images
- **Auto-Post Scheduler** — Schedule posts to Meta, Twitter, etc.
- **Website Builder** — Auto-generate and deploy branded websites

Default behavior: All workflows run silently with zero user setup. Advanced users (Hunter tier) can view/edit/duplicate workflows in the **Automations** panel.

### RLM (Recursive Language Model) — Pro/Hunter Only
Process unlimited context for:
- **Full Website Crawls** — Extract entire website content without token limits
- **Deep Competitive Analysis** — Analyze multiple competitors across unlimited dimensions
- **Extended Conversation History** — Maintain full context in multi-turn Closer Agent sequences
- **Unbounded Context Processing** — Handle complex, multi-step analyses that exceed standard context windows

Enable RLM in **Settings → RLM Mode** and configure:
- **Root Model** — Primary model for root-level analysis (e.g., Google Gemini)
- **Recursive Model** — Model for sub-task decomposition (e.g., OpenAI GPT-4)
- **Max Recursion Depth** — Number of recursion levels (1-10)
- **Context Window** — Max tokens per request (50k-1M)

## Run Locally

**Prerequisites:** 
- Node.js
- n8n (running headless or locally: `npx n8n start`)

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up n8n (Automation Engine):**
   ```bash
   # Option A: Local installation
   npx n8n start
   
   # Option B: Docker
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

3. **Deploy workflows to n8n:**
   - Open n8n at http://localhost:5678
   - Create the 5 core workflows using the templates in `services/workflowConfigs.ts`
   - Get each workflow's ID and note them

4. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   
   Then fill in your API keys:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_N8N_API_URL=http://localhost:5678/api/v1
   VITE_N8N_API_KEY=internal
   # ... other keys
   ```

5. **Start the app:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:5173
   - n8n Dashboard: http://localhost:5678 (optional, for advanced users)

## Multi-Provider LLM Support

Seamlessly switch between 40+ LLM providers:
- **Fast & Free:** Google Gemini, Groq, Ollama
- **Advanced:** OpenAI (GPT-4), Claude 3.5, Mistral
- **Specialized:** DeepSeek, Grok (xAI), Qwen, LLaMA 3
- **High-Performance:** SambaNova, Cerebras, Hyperbolic
- **Local:** Ollama, Custom OpenAI-compatible endpoints

## Architecture

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS |
| **State Management** | React Context + LocalStorage |
| **AI Integration** | 40+ LLM providers + RLM wrapper |
| **Visualization** | Recharts (radar, bar charts) |
| **Animation** | Framer Motion |

## Tier-Based Access

| Feature | Free | Pro | Hunter |
|---------|------|-----|--------|
| Brand DNA Extraction | ✓ | ✓ | ✓ |
| Battle Mode | ✓ | ✓ | ✓ |
| Lead Hunter | Limited | ✓ | ✓ |
| Closer Agent | ✗ | ✓ | ✓ |
| **RLM Mode** | ✗ | **✓** | **✓** |
| Multi-Provider LLMs | 3 | Unlimited | Unlimited |
| White-Label | ✗ | ✓ | ✓ |

## n8n Workflow Architecture

All core features run as n8n workflows with automatic triggering from the UI:

| Workflow | Trigger | Input | Output |
|----------|---------|-------|--------|
| **Lead Generation** | Hunt Leads button | niche, latitude, longitude | LeadProfile[] |
| **Closer Agent Swarm** | Generate Portfolio button | lead, dna | CloserPortfolio |
| **Campaign Generation** | Create Campaign | dna, goal | CampaignAsset[] |
| **Auto-Post Scheduler** | Schedule button | campaign, schedule | postStatus |
| **Website Builder** | Build Website | dna | { url, buildTime } |

### Workflow Integration Points

```typescript
// In ExtractPage, BattleMode, CampaignsPage, etc.:
if (n8nService.isAvailable()) {
    result = await n8nService.runLeadGeneration(...);
} else {
    result = await standardFallback(...); // Graceful fallback
}
```

All workflows execute **silently** — users see a progress indicator but not the engine mechanics.

## File Structure

```
src/
├── pages/                    # Main app pages
│   ├── ExtractPage.tsx       # DNA extraction + Lead Hunter (with n8n integration)
│   ├── BattleModePage.tsx    # Competitive analysis
│   ├── CampaignsPage.tsx     # Campaign management
│   ├── SettingsPage.tsx      # LLM, RLM, White-Label config
│   ├── AutomationsPage.tsx   # Workflow inspection (Hunter tier)
│   └── ...
├── components/               # Reusable UI components
├── services/
│   ├── geminiService.ts      # LLM integration
│   ├── rlmService.ts         # RLM wrapper for infinite context
│   ├── n8nService.ts         # n8n workflow orchestration
│   └── workflowConfigs.ts    # Workflow definitions & metadata
├── contexts/                 # React Context
├── hooks/                    # Custom hooks
├── types.ts                  # TypeScript interfaces
└── constants.ts              # Config & defaults
```

## Advanced Features (Non-Breaking)

### 1. n8n Automation Engine
- **Default**: All workflows run silently — zero user setup
- **Graceful Fallback**: If n8n is unavailable, standard mode activates automatically
- **Advanced Panel**: Hunter tier users can access Automations page to view/edit workflows
- **No External Branding**: n8n UI is hidden from regular users; Core DNA is fully white-labeled

### 2. RLM (Recursive Language Model)
- All existing features work without RLM enabled
- Graceful fallback to standard LLM when RLM is disabled
- Settings-driven activation (Pro/Hunter tiers only)
- Independent of multi-provider support

### 3. White-Label
- Complete brand customization in Settings
- No Core DNA branding exposed in default UI
- n8n and other engines kept invisible to end users

---

## Architecture Philosophy

**Magic Hidden by Default**
- Users see smooth, automated workflows
- Internal engine complexity is abstracted away
- n8n orchestration runs silently in the background

**Power for Advanced Users**
- Hunter tier can access Automations panel
- View, duplicate, and customize workflows
- No training required—works out of the box

**No Vendor Lock-In**
- All workflows are portable n8n designs
- LLM providers are swappable
- Fallback mechanisms ensure core features always work

---

Built for agencies, consultants, and sales teams who need deep brand and market intelligence at scale. 

**Now with a fully autonomous workflow engine that runs silently behind the scenes.**
