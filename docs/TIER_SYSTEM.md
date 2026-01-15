# CoreDNA2 Unified Tier System

**4 Unified Tiers - All in one place**

---

## TIER 1: FREE
**For:** Individuals trying out the platform
**Price:** Free forever

### Features
- ✅ 1 DNA extraction per month
- ✅ Brand portfolio storage
- ✅ Basic analytics
- ✅ 2 LLM providers (Google, OpenAI)
- ✅ 1 Image provider (Google)
- ✅ 1 Voice provider (OpenAI)
- ✅ Export profiles as JSON
- ❌ No AI inference optimizations
- ❌ No workflows
- ❌ No website builder

**Use Case:** Explore features, test extraction quality

---

## TIER 2: PRO
**For:** Agencies & professionals
**Price:** $49-99/month

### Includes Everything from FREE, plus:
- ✅ **Unlimited** DNA extractions
- ✅ All 30+ LLM providers
- ✅ All 20+ Image providers  
- ✅ All 15+ Voice providers
- ✅ **Inference Optimizations:**
  - Speculative Decoding
  - Self-Consistency (Quality Mode)
  - Skeleton of Thought
  - Chain of Verification
- ✅ RLM (Recursive Language Model)
- ✅ **4 Core Workflows:**
  - Lead Generation (scrape → DNA scan → filter)
  - Closer Agent Swarm (researcher → writer → closer)
  - Campaign Generation (DNA → posts/banners/emails)
  - Website Builder (generate 5-page sites)
- ✅ Website deployment to Rocket.new
- ✅ Live URLs & live site updates
- ✅ Sonic Agent chat widget
- ✅ Email support

**Use Case:** Professional brand analysis, campaign generation, automated lead gen

---

## TIER 3: HUNTER
**For:** Advanced users & workflow power users
**Price:** $199-299/month

### Includes Everything from PRO, plus:
- ✅ **Workflow Automation:**
  - View all workflows in Automations panel
  - Edit & customize workflow nodes
  - Build custom n8n workflows
  - Schedule-triggered automations
- ✅ **Advanced Workflows:**
  - Auto-Post Scheduler (daily social media posting)
  - Website Builder with advanced options
  - Schedule campaigns to run automatically
- ✅ Blog section on generated websites
- ✅ Advanced analytics & performance tracking
- ✅ API access for custom integrations
- ✅ Priority support

**Use Case:** Agency operations, automation workflows, high-volume campaigns

---

## TIER 4: AGENCY (Enterprise)
**For:** Teams & enterprises
**Price:** Custom pricing (Contact Sales)

### Includes Everything from HUNTER, plus:
- ✅ **Team Features:**
  - Unlimited team members
  - Role-based access control
  - Audit logs & activity tracking
- ✅ **White-label:**
  - Custom domain
  - Custom branding throughout
  - Remove CoreDNA branding
  - White-label Sonic Agent
- ✅ **Bulk Operations:**
  - Bulk extract (100+ profiles at once)
  - Batch campaign generation
  - Multi-brand analytics
- ✅ **Enterprise Support:**
  - Dedicated account manager
  - Priority phone support
  - Custom SLA agreements
  - Custom integration support
- ✅ Single Sign-On (SSO)
- ✅ Advanced security features
- ✅ Data residency options

**Use Case:** Enterprise agencies, multi-team organizations, resellers

---

## FEATURE MATRIX

| Feature | FREE | PRO | HUNTER | AGENCY |
|---------|------|-----|--------|--------|
| DNA Extractions/month | 1 | Unlimited | Unlimited | Unlimited |
| LLM Providers | 2 | All (30+) | All (30+) | All (30+) |
| Image Providers | 1 | All (20+) | All (20+) | All (20+) |
| Voice Providers | 1 | All (15+) | All (15+) | All (15+) |
| Speculative Decoding | ❌ | ✅ | ✅ | ✅ |
| Self-Consistency | ❌ | ✅ | ✅ | ✅ |
| Skeleton of Thought | ❌ | ✅ | ✅ | ✅ |
| Chain of Verification | ❌ | ✅ | ✅ | ✅ |
| RLM | ❌ | ✅ | ✅ | ✅ |
| Core Workflows (4) | ❌ | ✅ | ✅ | ✅ |
| Workflow Editing | ❌ | ❌ | ✅ | ✅ |
| Scheduled Automations | ❌ | ❌ | ✅ | ✅ |
| Website Builder | ❌ | ✅ | ✅ | ✅ |
| Blog Section | ❌ | ❌ | ✅ | ✅ |
| Sonic Agent | ❌ | ✅ | ✅ | ✅ |
| Team Members | 1 | 1 | 1 | Unlimited |
| White-label | ❌ | ❌ | ❌ | ✅ |
| Bulk Extract | ❌ | ❌ | ❌ | ✅ |
| Email Support | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Dedicated Manager | ❌ | ❌ | ❌ | ✅ |
| SSO/SAML | ❌ | ❌ | ❌ | ✅ |

---

## Code Implementation

All tiers are now unified in the `UserProfile` type:
```typescript
tier: 'free' | 'pro' | 'hunter' | 'agency'
```

### Service Tier Mapping
Internal services use the same tier system for consistency:
- `free` - No optimizations
- `pro` - All inference techniques enabled
- `hunter` - Workflow editing + automation access
- `agency` - Full enterprise features

### Feature Gates
Use `user.tier` in React components:
```typescript
{user.tier === 'pro' && <ProFeature />}
{user.tier === 'hunter' && <WorkflowAutomation />}
{user.tier === 'agency' && <BulkExtract />}
```

---

## Tier Colors
- **FREE**: Gray (#9CA3AF)
- **PRO**: Purple (#A78BFA)
- **HUNTER**: Blue (#60A5FA)
- **AGENCY**: Emerald/Green (#34D399)

---

## Notes
- Demo user is set to `agency` tier for full access
- All tiers inherit features from lower tiers
- "Contact Sales" for Agency pricing inquiries
- Free tier has 1 extraction/month limit to prevent abuse
