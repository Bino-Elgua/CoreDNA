# CoreDNA2 — Complete Platform Breakdown

**Enterprise AI Brand Intelligence & Marketing Automation Platform**

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Architecture](#core-architecture)
3. [Feature Modules](#feature-modules)
4. [Services & Engines](#services--engines)
5. [UI Pages & Components](#ui-pages--components)
6. [Provider Integrations](#provider-integrations)
7. [Data Models](#data-models)
8. [Subscription Tiers](#subscription-tiers)
9. [Tech Stack](#tech-stack)

---

## Platform Overview

### Mission
Extract brand essence from any website, auto-generate unlimited marketing assets, and automate sales workflows through AI.

### Live Platform
- **App:** https://app.coredna.ai
- **Docs:** https://docs.coredna.ai
- **Status:** https://status.coredna.ai

### Key Capabilities
- 🧬 Brand DNA extraction (AI analysis of brand identity)
- 🎨 Unlimited asset generation (social, email, ads, video, blog)
- 🌐 Instant website creation & deployment
- 🎤 Voice-activated AI assistant (Sonic Co-Pilot)
- 🤖 Workflow automation (n8n-powered)
- 👥 Team collaboration & multi-user workspace
- 📊 Lead hunting & sales automation
- 🔄 Real-time campaign orchestration

---

## Core Architecture

### Technology Stack
```
Frontend:   React 19 + TypeScript + Vite
Backend:    Supabase (PostgreSQL)
AI:         70+ LLM/Image/Video/Voice providers
Automation: n8n workflow engine
Voice:      Web Speech API + custom voice synthesis
Deployment: Vercel / Firebase / Custom servers
Database:   Supabase PostgreSQL
Auth:       Supabase Auth
```

### Project Structure
```
CoreDNA2-work/
├── pages/                    # Main application pages
├── components/               # Reusable React components
├── services/                 # Business logic & API integration
├── contexts/                 # React context providers
├── hooks/                    # Custom React hooks
├── types.ts                  # TypeScript interfaces
├── index.tsx                 # Entry point
└── [config files]            # Vite, Tailwind, TypeScript config
```

---

## Feature Modules

### 1. 🧬 Brand Extraction (ExtractPage)
**What it does:** Analyzes any website and creates a complete brand profile

**Inputs:**
- Website URL
- Optional: Company description, industry context

**Outputs: BrandDNA object containing:**
- Brand name, tagline, mission, elevator pitch
- Core values & key messaging
- Target audience & personas
- SWOT analysis (strengths, weaknesses, opportunities, threats)
- Competitor analysis
- Color palette (primary + secondary) with psychology
- Typography (fonts and usage)
- Visual style (modern, minimalist, corporate, etc.)
- Tone of voice (adjectives, description, personality)
- Sonic identity (voice type, music genre, sound keywords)
- Accessibility guidelines
- Confidence scores (visuals, strategy, tone, overall)
- Trend alignment analysis
- Extended visual identity (logo, patterns, iconography, mood boards)

**Services Used:**
- `enhancedExtractionService.ts` — Main extraction pipeline
- `geminiService.ts` — LLM integration (text generation)
- `advancedScraperService.ts` — Website content scraping
- `healthCheckService.ts` — Validation & error checking

**Key Features:**
- Multi-language support (auto-detects language)
- Recursive analysis (RLM - Recursive Language Models)
- Confidence scoring for quality assurance
- Self-healing mode (validates & regenerates if quality low)

---

### 2. 🎨 Campaign Generation (CampaignsPage)
**What it does:** Generates unlimited marketing assets automatically

**Workflow:**
1. Select brand DNA (from extraction)
2. Define campaign goal (awareness, conversion, engagement, etc.)
3. Choose channels (Instagram, LinkedIn, Twitter, TikTok, Email, Blog)
4. Generate PRD (Product Requirements Document) with user stories
5. Run autonomous mode to generate assets
6. Review, edit, and schedule for posting

**Asset Types Generated:**
- Social media posts (Instagram, LinkedIn, Twitter, TikTok)
- Email campaign content (subject + body)
- Ad copy (headlines + body + CTAs)
- Blog article sections (intro, body, conclusion)
- Video prompts (for video generation)
- Landing page copy

**Asset Components:**
- Headline/title (for SEO, engagement)
- Body copy (channel-optimized length)
- Call-to-action (personalized per channel)
- Image prompt (detailed visual direction)
- Generated image (via image provider)
- Video URL (if video generation enabled)
- Scheduled posting time
- Metadata (channel, type, status)

**Services Used:**
- `campaignPRDService.ts` — PRD generation & story management
- `autonomousCampaignService.ts` — AI-powered story execution
- `campaignSequencingService.ts` — Multi-asset sequencing
- `geminiService.ts` — Asset generation via LLM
- `selfHealingService.ts` — Quality validation & auto-improvement
- `sonicCoPilot.ts` — Voice-based validation

**Key Features:**
- 🚀 **Full Autonomous Mode** — AI executes all stories automatically
- 👣 **Step-by-Step Mode** — Manual approval between stories
- 🔄 **Self-Healing Loop** — Validates assets and regenerates if not meeting criteria
- 📊 **Learning Feedback** — Captures insights from each execution
- 🎨 **Multi-channel Optimization** — Different content per platform
- 🤖 **Recursive Improvement** — Max 10 iterations per story

---

### 3. 🌐 Website Builder (SiteBuilderPage)
**What it does:** Auto-generates and deploys websites based on brand DNA

**Workflow:**
1. Select brand DNA
2. Configure site structure (hero, features, about, CTA, footer)
3. Generate content & visuals
4. Deploy to Vercel, Firebase, or custom domain

**Generated Site Includes:**
- Responsive design (mobile-first)
- Brand colors & typography
- Hero section with brand imagery
- Features/services section
- About/mission section
- Call-to-action sections
- Contact form
- Footer with brand info
- SEO metadata

**Services Used:**
- `siteGeneratorService.ts` — Site structure & content generation
- `siteDeploymentService.ts` — Deployment orchestration
- `vercelService.ts` — Vercel integration
- `firebaseDeploymentService.ts` — Firebase hosting
- `geminiService.ts` — Content generation

**Key Features:**
- 🎨 **Auto-design** from brand DNA
- 🚀 **One-click deployment** to Vercel/Firebase
- 📱 **Mobile-responsive** by default
- 🔍 **SEO-optimized** (metadata, alt text)
- 🔄 **Live editing** before deployment
- 💾 **Version control** (save iterations)

---

### 4. 🎤 Sonic Co-Pilot (SonicLabPage)
**What it does:** Voice-activated AI assistant for real-time brand guidance

**Features:**
- 🎙️ **Voice input** (Web Speech API) — Speak requests naturally
- 🤖 **AI response** — Gemini, OpenAI, etc. understand context
- 🎵 **Voice synthesis** — TTS playback (ElevenLabs, Azure, Google, etc.)
- 🧠 **Brand context aware** — Uses loaded BrandDNA for consistency
- 📞 **Conversational** — Multi-turn dialogue
- 💬 **Chat interface** — Text fallback when voice unavailable

**Services Used:**
- `sonicCoPilot.ts` — Voice conversation pipeline
- `geminiService.ts` — AI understanding & response
- Web Speech API (browser native)
- TTS providers (ElevenLabs, OpenAI, Google, Azure, etc.)

**Supported Commands Examples:**
- "Generate 5 Instagram posts for this brand"
- "What are the brand's core values?"
- "Create email campaign for product launch"
- "Validate if this headline matches the brand tone"
- "Generate website copy for features section"

**Tiers:**
- Free/Pro: Chat only
- Hunter+: Voice input + synthesis

---

### 5. 🚀 Automations (AutomationsPage)
**What it does:** Integrates with n8n for workflow automation

**Automation Types:**
- 📅 **Schedule posts** — Auto-post assets to social media
- 🔄 **Webhook integration** — Connect external services
- 📊 **Lead sync** — Auto-import leads from CRM
- 💌 **Email sequences** — Automated follow-up campaigns
- 📱 **Social sync** — Cross-post to multiple platforms
- 📈 **Analytics sync** — Pull performance data from social providers

**Services Used:**
- `n8nService.ts` — n8n workflow management
- `workflowProvider.ts` — Workflow execution & monitoring
- `workflowConfigs.ts` — Pre-built workflow templates

**Supported Platforms:**
- n8n (self-hosted/cloud)
- Zapier
- Make.com
- ActivePieces
- LangChain / LangGraph
- Pipedream
- Relay.app
- Integrately
- Pabbly Connect
- Tray.io
- Dify
- Custom RAG (Knowledge Base)

---

### 6. 🎯 Battle Mode (BattleModePage)
**What it does:** A/B compare two brands side-by-side

**Features:**
- 📊 **Head-to-head comparison** of two BrandDNA profiles
- 🎨 **Visual analysis** (color palette, imagery style)
- 📝 **Messaging analysis** (tone, values, messaging)
- 💡 **Market positioning** (differentiation, gaps)
- 📈 **Performance metrics** (with scoring)
- 🔍 **Gap analysis** (what's missing vs competitor)
- 📋 **Detailed critique** from brand strategist perspective

**Services Used:**
- `competitorAnalysisService.ts` — Competitive intelligence

---

### 7. 👥 Lead Hunter (LeadHunterPanel component)
**What it does:** AI-powered B2B lead finding & qualification

**Workflow:**
1. Input target industry/location/company size
2. AI scrapes LinkedIn, Google Maps, business directories
3. Qualifies leads based on vulnerability analysis
4. Creates detailed lead profiles with opportunity scoring
5. Generates personalized closer portfolio for each lead

**Lead Profile Includes:**
- Company name, address, website, rating
- Tech stack (detected from website)
- Contact info (email, phone, social profiles)
- **Gap analysis:**
  - Missing website?
  - Low ratings?
  - Weak social presence?
- **Closer portfolio** (personalized sales assets)

**Closer Portfolio Generated:**
- 📧 **Subject line** (attention-grabbing)
- 💬 **Email body** (personalized, benefit-focused)
- 🎯 **Closing script** (objection handling)
- 🛡️ **Objection rebuttals** (pre-written responses)
- 📅 **Follow-up sequence** (5-7 day drip campaign)
- 📱 **Sample posts** (for social outreach)
- 🎨 **Brand essence** (what we discovered about them)

**Services Used:**
- `advancedScraperService.ts` — Web scraping & lead discovery
- `enhancedExtractionService.ts` — Lead brand analysis
- `geminiService.ts` — Content generation (emails, scripts)
- `competitorAnalysisService.ts` — Vulnerability analysis

---

### 8. 📊 Trend Pulse (TrendPulse component)
**What it does:** Identifies trending topics relevant to brand

**Features:**
- 🔥 **Trend detection** — Real-time trending topics
- 📈 **Relevance scoring** — How relevant to your brand
- 💡 **Suggested angles** — Content ideas based on trends
- 🎯 **Topic summaries** — Quick briefing on trending topic
- 🚀 **Campaign ideas** — How to leverage trend for brand

**Services Used:**
- `rocketNewService.ts` — Trend detection & analysis

---

### 9. 🎬 Video Generation (VideoProvidersSection component)
**What it does:** Creates videos from images/prompts

**Engines Supported:**
- **LTX-2** (Lightricks) — Fast, cost-effective (~1 credit)
- **Sora 2 Pro** (OpenAI) — Premium, cinematic (~5 credits)
- **Veo 3** (Google) — Superior physics & coherence (~5 credits)
- Plus: Runway, Kling, Luma, Mochi, HeyGen, Synthesia, etc.

**Tier Limits:**
- **Free:** 5 videos/month (LTX-2 only)
- **Pro:** 50 videos/month (LTX-2 only)
- **Hunter:** Unlimited (LTX-2: 1cr, Sora/Veo: 5cr each)
- **Agency:** Unlimited (all included)

**Services Used:**
- `videoService.ts` — Video generation orchestration
- Individual provider APIs

---

### 10. 📋 Scheduler (SchedulerPage)
**What it does:** Schedule asset posting across channels

**Features:**
- 📅 **Calendar view** — Visual scheduling
- ⏰ **Time zone support** — Post at optimal times
- 🔄 **Bulk scheduling** — Schedule multiple assets at once
- 📊 **Analytics tracking** — Monitor performance post-launch
- 🔗 **Platform sync** — Direct integration with Buffer, Later, etc.

---

### 11. 🌐 Live Sessions (LiveSessionPage)
**What it does:** Real-time collaboration on brand work

**Features:**
- 👥 **Team collaboration** — Multiple users editing simultaneously
- 💬 **In-app chat** — Discuss changes in real-time
- 📝 **Version history** — Track all changes
- 🔔 **Notifications** — Alerts on team activity
- 🎯 **Permission management** — View/edit/admin roles

---

### 12. 🤝 Affiliate Hub (AffiliateHubPage)
**What it does:** Partner referral & commission management

**Features:**
- 🔗 **Referral links** — Unique tracking URLs
- 💰 **Commission tracking** — Monitor earnings
- 📊 **Dashboard** — Real-time stats
- 🎁 **Reward tiers** — Increase commission with volume
- 📧 **Email marketing** — Pre-built affiliate templates

---

### 13. 🧪 Brand Simulator (BrandSimulatorPage)
**What it does:** Test brand ideas before execution

**Features:**
- 🎨 **Design variations** — Generate design alternatives
- 📝 **Copy testing** — A/B test messaging
- 👥 **Audience testing** — Get feedback from target personas
- 📊 **Predictive scoring** — Estimate performance

---

### 14. 🤖 Agent Forge (AgentForgePage)
**What it does:** Create custom AI agents with guardrails

**Features:**
- 🧠 **Agent definition** — Set role, personality, knowledge base
- 🛡️ **Guardrails** — Define restrictions & required phrases
- 📚 **Knowledge base** — Upload documents/context
- 🔍 **Testing** — Chat with agent before deployment
- 🚀 **Deployment** — Push to production or integrate via API

**Agent Types:**
- **Support Agent** — Customer service
- **Sales Agent** — Lead qualification & closing
- **Content Guardian** — Brand voice enforcement
- **Creative Director** — Design feedback & iteration

---

## Services & Engines

### Core AI Services

#### 1. **Gemini Service** (`geminiService.ts` - 1300+ lines)
Central hub for all AI operations:
- LLM selection & provider routing
- Prompt engineering
- Token counting & optimization
- Response parsing (JSON extraction)
- Image generation
- Campaign asset generation
- Content refinement
- RLM (Recursive Language Models) integration

**Supported LLMs:** 31 providers
- Google Gemini (primary)
- OpenAI GPT-4/4o
- Claude (Anthropic)
- Mistral, DeepSeek, Groq
- Plus 25 others (Qwen, Cohere, etc.)

---

#### 2. **Sonic Co-Pilot Service** (`sonicCoPilot.ts`)
Voice-based AI interaction:
- Voice input capture
- Natural language understanding
- Multi-turn conversation context
- Brand-aware responses
- Voice synthesis output
- Pro/standard tiers

---

#### 3. **Enhanced Extraction Service** (`enhancedExtractionService.ts` - 600+ lines)
Website analysis & brand profiling:
- HTML parsing & content extraction
- Visual analysis (colors, fonts)
- Text analysis (tone, values, messaging)
- SWOT generation
- Persona creation
- Confidence scoring
- Multi-language support
- Self-healing mode (auto-regenerate if confidence low)

---

#### 4. **Self-Healing Service** (`selfHealingService.ts`)
Quality assurance & auto-improvement:
- Asset validation (against brand guidelines)
- Issue detection & scoring
- Feedback generation
- Recursive regeneration (up to 3 attempts)
- Healing metrics & statistics
- Batch processing for multiple assets

**Validation Loop:**
1. Validate asset
2. If passes (score ≥80) → complete
3. If fails → identify issues & suggestions
4. Regenerate asset with feedback
5. Re-validate
6. Repeat (max 3 times)

---

#### 5. **RLM Service** (`rlmService.ts`)
Recursive Language Model for deep analysis:
- Multi-level analysis (root → recursive)
- Deep context windows (up to 200K tokens)
- Configurable recursion depth
- Model selection (root vs recursive)

---

#### 6. **Inference Engine Service** (`inferenceRouter.ts`)
Advanced AI techniques:
- **Speculative Decoding** — Faster generation
- **Self-Consistency** — Multiple samples for accuracy
- **Skeleton of Thought** — Structured reasoning
- **Chain of Verification** — Cross-checking outputs
- Configurable activation per feature

---

#### 7. **Campaign PRD Service** (`campaignPRDService.ts`)
Campaign planning & orchestration:
- PRD generation from campaign brief
- User story creation
- Acceptance criteria definition
- Progress tracking
- Story completion marking
- Learnings capture

---

#### 8. **Autonomous Campaign Service** (`autonomousCampaignService.ts`)
AI-powered campaign execution:
- Story-by-story execution
- Asset generation per story
- Validation & quality checks
- Error handling & retry logic
- Learning feedback loop
- Multi-iteration support

---

#### 9. **Advanced Scraper Service** (`advancedScraperService.ts`)
Web content extraction:
- HTML parsing (jsdom)
- Link extraction
- Text content cleanup
- Metadata extraction
- Error handling & retry
- Timeout management

---

#### 10. **Health Check Service** (`healthCheckService.ts`)
Provider health & validation:
- Endpoint testing
- API key validation
- Response time monitoring
- Error rate tracking
- Provider health dashboard

---

#### 11. **Video Service** (`videoService.ts`)
Video generation management:
- Tier-based limits (Free/Pro/Hunter/Agency)
- Credit system (Hunter tier)
- Engine selection
- Video history tracking
- Cost calculation per engine

---

#### 12. **Site Generator Service** (`siteGeneratorService.ts`)
Website content generation:
- Section-by-section generation
- Responsive design templates
- Image placeholder generation
- SEO metadata generation
- Form configuration

---

#### 13. **Competitor Analysis Service** (`competitorAnalysisService.ts`)
Competitive intelligence:
- SWOT comparison
- Positioning analysis
- Differentiation detection
- Gap analysis

---

#### 14. **Asset Refinement Service** (`assetRefinementService.ts`)
Post-generation polish:
- Copy editing
- Tone adjustment
- Length optimization
- CTA improvement
- Brand alignment check

---

#### 15. **Brand Voice Validator Service** (`brandVoiceValidatorService.ts`)
Tone & messaging validation:
- Checks against brand personality
- Consistency scoring
- Tone matching
- Messaging alignment

---

### Deployment & Integration Services

#### 16. **n8n Service** (`n8nService.ts`)
Workflow automation integration:
- Webhook management
- Workflow trigger setup
- Execution monitoring
- Schedule management
- Error handling

---

#### 17. **Vercel Service** (`vercelService.ts`)
Vercel deployment:
- Project creation
- Deployment triggering
- Environment variable setup
- Domain management

---

#### 18. **Firebase Service** (`firebaseDeploymentService.ts`)
Firebase hosting:
- Hosting deployment
- Build configuration
- Custom domain setup
- SSL management

---

#### 19. **GitHub Service** (`githubService.ts`)
Repository management:
- Repo creation
- Commit management
- Branch handling
- API integration

---

### Data & State Services

#### 20. **Settings Service** (`settingsService.ts`)
User settings management:
- Supabase persistence
- LocalStorage fallback
- Format migration (legacy → new)
- Multi-provider configuration
- Upsert logic

---

#### 21. **Supabase Client** (`supabaseClient.ts`)
Database initialization:
- PostgreSQL connection
- Auth setup
- Real-time subscriptions
- RLS policies

---

#### 22. **Toast Service** (`toastService.ts`)
Notification system:
- Success/error/info messages
- Auto-dismiss
- Stacking management

---

### Additional Services

#### 23. **Workflow Provider Manager** (`workflowProvider.ts`)
Workflow execution engine:
- Provider abstraction
- Workflow template management
- Execution monitoring

---

#### 24. **A/B Testing Service** (`abTestingService.ts`)
Experimentation framework:
- Variant creation
- Result tracking
- Statistical significance calculation

---

#### 25. **Failure Prediction Service** (`failurePredictionService.ts`)
Risk detection:
- Quality score prediction
- Failure likelihood
- Preventive recommendations

---

#### 26. **Resource Allocation Service** (`resourceAllocationService.ts`)
Quota management:
- Usage tracking
- Limit enforcement
- Tier-based allocation

---

#### 27. **Campaign Sequencing Service** (`campaignSequencingService.ts`)
Multi-asset orchestration:
- Content sequencing
- Timing optimization
- Platform-specific ordering

---

#### 28. **Rocket News Service** (`rocketNewService.ts`)
Trend detection:
- Real-time trending analysis
- Relevance scoring
- Content suggestions

---

#### 29. **Amp CLI Service** (`ampCLIService.ts`)
Command-line interface:
- Batch operations
- Scripting support
- Automation triggers

---

## UI Pages & Components

### Pages (18 total)

| Page | Purpose | Key Features |
|------|---------|-------------|
| **ExtractPage** | Brand extraction | URL input, BrandDNA display, confidence scores |
| **CampaignsPage** | Campaign generation | PRD builder, asset generation, autonomous mode |
| **SiteBuilderPage** | Website creation | Site generator, deployment, live preview |
| **SonicLabPage** | Voice AI | Voice input/output, conversational, brand context |
| **AutomationsPage** | Workflow setup | n8n integration, scheduling, webhooks |
| **BattleModePage** | Competitive analysis | A/B brand comparison, metrics, gap analysis |
| **SchedulerPage** | Asset scheduling | Calendar view, bulk scheduling, analytics |
| **LiveSessionPage** | Team collaboration | Real-time editing, chat, version history |
| **AffiliateHubPage** | Referral program | Referral links, commission tracking, analytics |
| **BrandSimulatorPage** | Idea testing | Design variations, copy testing, scoring |
| **AgentForgePage** | Custom agents | Agent builder, guardrails, testing, deployment |
| **DashboardPage** | Overview | Quick stats, recent activity, shortcuts |
| **LandingPage** | Marketing | Product overview, pricing, CTA |
| **SharedProfilePage** | Public view | Public BrandDNA sharing |
| **SettingsPage** | Configuration | API keys, provider setup, theme, team |

### Components (22 reusable)

| Component | Purpose |
|-----------|---------|
| **DNAProfileCard** | Display BrandDNA (colors, fonts, values, etc.) |
| **DNAHelix** | 3D brand visualization |
| **AssetCard** | Individual asset display with edit/preview |
| **AssetEditor** | Inline asset editing |
| **LeadHunterPanel** | Lead discovery & profiling |
| **SelfHealingPanel** | Quality validation & regeneration UI |
| **SonicOrb** | Voice input button with visual feedback |
| **TrendPulse** | Trending topics feed |
| **ApiKeysSection** | Provider key management UI |
| **VideoProvidersSection** | Video engine selection & pricing |
| **VideoPricingSection** | Video tier pricing display |
| **ApiKeyPrompt** | Simple key input modal |
| **AnalyticsSection** | Campaign performance metrics |
| **UserProfileCard** | User tier & usage display |
| **AutonomousCampaignMode** | Campaign execution UI (modal) |
| **CampaignPRDGenerator** | PRD builder (modal) |
| **IntelligentCampaignDashboard** | Campaign overview & management |
| **SavedCampaignsModal** | Saved campaigns browser |
| **InferenceBadge** | Inference technique indicator |
| **HealthCheckInput** | Provider testing UI |
| **ToastContainer** | Notification display |
| **Layout** | App shell (nav, header, footer) |

---

## Provider Integrations

### LLM Providers (31 total)

**Primary:**
- Google Gemini ⭐
- OpenAI (GPT-4, GPT-4o, etc.)
- Anthropic Claude (3-3.5-Sonnet)

**Popular:**
- Mistral AI
- DeepSeek
- Groq
- Together AI
- OpenRouter
- Perplexity

**Specialized:**
- QWen (Alibaba)
- Cohere
- Meta Llama
- Microsoft Azure OpenAI
- SambaNova
- Cerebras
- Hyperbolic
- Nebius

**Local/Custom:**
- Ollama (local)
- Custom OpenAI-compatible

---

### Image Providers (21 total)

**Best-in-class:**
- Google Imagen ⭐
- OpenAI DALL-E 3 / DALL-E 4
- Stability AI (Stable Diffusion)

**Premium:**
- Midjourney
- Leonardo.ai
- Replicate
- RunWare

**Open-source:**
- FAL.ai (Flux)
- Black Forest Labs (FLUX)
- Hugging Face

**Specialized:**
- Adobe Firefly
- Microsoft Designer (Bing)
- Recraft
- Ideogram
- Bria
- Segmind
- Prodia
- DeepAI

**Others:**
- Amazon Titan
- Hunyuan (Tencent)
- Wan

---

### Video Providers (22 total)

**Premium:**
- OpenAI Sora 2 Pro ⭐
- Google Veo 3 ⭐
- Runway Gen-4

**Established:**
- Kling AI 2.6
- Luma Dream Machine
- HeyGen
- Synthesia

**Fast/Budget:**
- Lightricks LTX-2 (fastest, cheapest)
- Pika Labs
- Pixverse
- Mochi 1

**Enterprise:**
- DeepBrain
- Colossyan

**Specialized:**
- Hailuo (Tencent)
- Higgsfield
- Seedance
- Replicate (multi-engine)
- FAL.ai (multi-engine)
- Fireworks.ai (multi-engine)

---

### Voice/TTS Providers (18 total)

**Premium:**
- ElevenLabs ⭐
- OpenAI TTS

**Natural-sounding:**
- PlayHT
- Cartesia (fastest)
- Resemble AI
- Murf AI

**Enterprise:**
- Microsoft Azure Speech
- Google Cloud TTS
- Amazon Polly

**Budget:**
- DeepGram
- LMNT
- Fish Audio
- Rime.ai
- Neets.ai
- Speechify

**Local:**
- Piper (offline)
- Custom TTS endpoints

---

### Workflow/Automation Providers (11 total)

- **n8n** ⭐ (primary)
- Zapier
- Make.com
- ActivePieces
- LangChain / LangGraph
- Pipedream
- Relay.app
- Integrately
- Pabbly Connect
- Tray.io
- Dify
- Custom RAG

---

## Data Models

### BrandDNA (Core)
Complete brand profile with 30+ fields:
- Identity (name, tagline, mission)
- Strategy (values, messaging, audience)
- Visual (colors, fonts, style, extended visuals)
- Personality (tone of voice, brand archetypes)
- Competitive (SWOT, competitors)
- Personas (3-5 target audience profiles)
- Accessibility & Sonic identity
- Confidence scores

### Campaign Objects
- **CampaignPRD** — Campaign plan with user stories
- **CampaignAsset** — Individual asset (title, copy, CTA, images)
- **SavedCampaign** — Campaign + results history

### Lead Objects
- **LeadProfile** — Company info + gap analysis
- **CloserPortfolio** — Personalized sales materials
- **CloserReport** — Market analysis + recommendations

### Website Objects
- **WebsiteData** — Site structure + content
- **SiteSection** — Hero, features, about, CTA, footer

### Analysis Objects
- **BattleReport** — A/B brand comparison
- **TrendPulseItem** — Trending topics
- **HealingAttempt** — Quality validation iteration

---

## Subscription Tiers

| Feature | Free | Pro | Hunter | Agency |
|---------|------|-----|--------|--------|
| **Price** | $0 | $49/mo | $149/mo | Custom |
| **Extractions/mo** | 3 | Unlimited | Unlimited | Unlimited |
| **Campaign Assets** | 10/mo | 100/mo | Unlimited | Unlimited |
| **LLM Providers** | Limited | All 31 | All 31 | All 31 |
| **Image Providers** | Google only | All 21 | All 21 | All 21 |
| **Video Engines** | LTX-2 (5/mo) | LTX-2 (50/mo) | All 22 (unlimited) | All 22 (unlimited) |
| **Voice Input** | ❌ | ❌ | ✅ Sonic Co-Pilot | ✅ Sonic Co-Pilot |
| **Team Users** | 1 | 1 | 3 | Unlimited |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **n8n Automation** | ❌ | ❌ | ✅ | ✅ |
| **Custom Agents** | ❌ | ❌ | ✅ | ✅ |
| **Video Credits** | Free | Free | Credit-based | Included |

### Video Credit System (Hunter+)
- LTX-2: 1 credit/video
- Sora 2 Pro: 5 credits/video
- Veo 3: 5 credits/video
- Credit packs: $19 (100), $79 (500), $139 (1000)

---

## Tech Stack

### Frontend
- **React 19** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool (fast dev server)
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **React Router** — Routing
- **jsdom** — DOM parsing (server-side)

### Backend
- **Supabase** — PostgreSQL + Auth + Real-time
- **Node.js** — Runtime

### AI/ML
- **70+ LLM providers** — Text generation
- **21 image providers** — Image generation
- **22 video providers** — Video generation
- **18 TTS providers** — Voice synthesis
- **Web Speech API** — Voice recognition (browser)

### Automation
- **n8n** — Workflow engine
- Multiple workflow platforms (Zapier, Make, etc.)

### Deployment
- **Vercel** — Frontend hosting
- **Firebase** — Alternative hosting
- **GitHub** — Version control

### Development
- **Git** — Version control
- **GitHub Actions** — CI/CD (configured)
- **ESLint + Prettier** — Code quality
- **Environment variables** — Configuration

---

## Key Statistics

- **31** LLM providers
- **21** Image providers
- **22** Video providers
- **18** Voice/TTS providers
- **11** Workflow providers
- **18** UI pages
- **22** Reusable components
- **29** Core services
- **4** Subscription tiers
- **1,300+** lines in main service (geminiService.ts)
- **600+** lines in extraction (enhancedExtractionService.ts)

---

## Development Quick Start

```bash
# Install & run
npm install
npm run dev

# Development server
http://localhost:3000/

# Build for production
npm run build

# Preview built version
npm run preview
```

### Environment Setup
```bash
# Copy template
cp .env.example .env.local

# Add your keys
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
VITE_GEMINI_API_KEY=your-gemini-key (optional for dev)
```

---

## Architecture Highlights

### 1. **Modular Design**
- Services handle business logic
- Components handle UI
- Clear separation of concerns

### 2. **Provider Abstraction**
- 70+ providers behind unified interfaces
- Easy to swap providers
- Fallback mechanisms

### 3. **AI-First**
- AI at every level (extraction, generation, validation)
- Self-healing loops (auto-improvement)
- RLM for deep analysis

### 4. **Real-time Capable**
- Supabase subscriptions
- Live collaboration support
- Instant notifications

### 5. **Scalable**
- Tier-based pricing
- Usage-based quotas
- White-label ready

### 6. **Privacy-First**
- BYOK (Bring Your Own Keys) model
- Client-side API calls
- Encrypted storage

---

## Common Workflows

### Extract Brand
1. Paste website URL
2. System scrapes & analyzes
3. Generates BrandDNA profile
4. User reviews & saves

### Generate Campaign
1. Select saved BrandDNA
2. Define campaign goal
3. Generate PRD with user stories
4. Run Autonomous Mode
5. AI generates assets automatically
6. Self-heals any low-quality assets
7. Review, edit, schedule

### Build Website
1. Select BrandDNA
2. Choose site sections
3. Generate content & visuals
4. Deploy to Vercel/Firebase
5. Get live URL

### Voice Interaction
1. Click Sonic Orb (microphone)
2. Speak request (e.g., "Generate 5 tweets")
3. AI understands & responds
4. Voice synthesis plays answer
5. Continue conversation

### Create Lead List
1. Define target criteria
2. AI hunts leads (web scraping)
3. Analyzes each company
4. Generates personalized closer portfolio
5. Provides email templates & scripts

---

**This is CoreDNA2 — a complete AI-powered marketing automation platform.**

For deployment, user guide, or technical questions, refer to:
- Docs: https://docs.coredna.ai
- Support: support@coredna.ai
- Status: https://status.coredna.ai
