# Core DNA v2 — Data Privacy & Security Policy

## Overview

Core DNA v2 handles sensitive business intelligence and contact data. This document outlines our privacy practices, data protection measures, and compliance requirements.

## Data Collection

### User-Provided Data
- **Brand DNA Profiles**: Visual style, tone, messaging, business info (stored locally + Supabase)
- **Lead Intelligence**: Contact info, email, phone, social profiles, business metrics
- **Campaign Assets**: Generated content, images, scheduling metadata
- **Settings**: User preferences, API key configurations (local storage only)

### Automatically Collected Data
- **Geolocation**: Latitude/longitude for lead discovery (ephemeral, not stored)
- **Browser Cache**: DOM operations, session state (localStorage)
- **Service Health**: n8n and workflow provider status checks

## Data Storage

### Client-Side (Browser)
```
localStorage:
  - core_dna_profiles         (Brand DNA array)
  - core_dna_saved_campaigns  (Campaign history)
  - core_dna_pending_queue    (Scheduler assets)
  - core_dna_settings         (User preferences)
```
**Retention**: Indefinite until user clears cache or deletes via UI.

### Server-Side (Supabase)
```
Database Tables:
  - user_settings             (Auth-gated per user via RLS)
```
**Retention**: Indefinite until user deletion via API.

## Security Measures

### Row-Level Security (RLS)
- All database queries enforce `auth.uid()::text = user_id` policy
- Users can **only** access their own settings
- Anonymous users access sandbox profile with strict isolation
- **Status**: ✅ Enforced via Supabase

### API Key Management
⚠️ **CRITICAL**: All LLM provider API keys are **client-accessible** via `VITE_*` environment variables.
- **Recommendation**: Implement server-side proxy for production
- **Current**: Development-only access pattern
- See `.env.example` for full list:
  - `VITE_GEMINI_API_KEY`
  - `VITE_OPENAI_API_KEY`
  - `VITE_ANTHROPIC_API_KEY`
  - `VITE_MISTRAL_API_KEY`
  - `VITE_GROQ_API_KEY`
  - Meta, Twitter, Firebase, Resend keys

### Workflow Integration (n8n)
- n8n workflows execute silently on user request (no data leakage to UI)
- Lead data is **anonymized** before sending to n8n:
  - Name, address, contact info sanitized
  - Only business metrics and gap analysis used
- n8n health check validates availability before execution
- Graceful fallback to local processing if n8n unavailable

### Inference Engine (RLM)
- Optional recursive LLM context processing
- Works with all supported LLM providers
- User can disable via settings
- **Default**: Disabled (backward compatible)

## Data Privacy

### User Data Rights
- **Access**: Users own all profile and campaign data
- **Deletion**: Delete via UI (clears localStorage) or request API deletion (Supabase)
- **Export**: Currently via localStorage JSON export (TODO: Add API export)
- **Retention**: Per user discretion (no auto-deletion)

### Third-Party Integrations
| Service | Data Shared | Purpose | Status |
|---------|-------------|---------|--------|
| Google Gemini | Content, goals | LLM analysis, generation | ✅ |
| OpenAI | Content, goals | Alternative LLM provider | ✅ |
| Anthropic (Claude) | Content, goals | Alternative LLM provider | ✅ |
| Mistral AI | Content, goals | Alternative LLM provider | ✅ |
| Groq | Content, goals | Fast inference | ✅ |
| Meta API | Campaign assets, targets | Social posting (if enabled) | ⚠️ TODO |
| Twitter API | Campaign assets | Social posting (if enabled) | ⚠️ TODO |
| Firebase | Site content | Web deployment (if enabled) | ⚠️ TODO |
| Resend | Email templates | Email sending (if enabled) | ⚠️ TODO |
| Google Maps | Niche search, location | Lead discovery | ✅ |
| n8n | Anonymized lead metrics | Workflow automation | ✅ |

## Recommended Improvements

### Short-Term (MVP)
1. **API Key Proxy** (CRITICAL for production)
   - Move all `VITE_*` keys to backend environment
   - Create `/api/llm-proxy` endpoint
   - Client calls backend instead of LLM directly

2. **Data Anonymization**
   - Implement lead data scrubbing before n8n
   - Hash email/phone for logging
   - Comply with GDPR/CCPA

3. **Audit Logging**
   - Log all data access events (Supabase audit log)
   - Track workflow executions
   - Monitor API key usage

### Medium-Term
1. **Encryption at Rest**
   - AES-256 for Supabase JSON fields
   - Client-side encryption option for sensitive fields

2. **Data Retention Policy**
   - Auto-delete profiles after 30 days inactivity (optional)
   - Auto-delete lead intelligence after 7 days
   - User-configurable retention windows

3. **Rate Limiting**
   - Max 10 lead generation requests/day per user
   - Max 5 campaign generations/day per user
   - Cost/latency warning for Self-Consistency (>3 samples)

### Long-Term
1. **Compliance Certifications**
   - SOC 2 Type II audit
   - GDPR Data Processing Agreement
   - CCPA compliance documentation

2. **Privacy Dashboard**
   - User-facing data inventory
   - Download all data (export as JSON)
   - Right to deletion with confirmation

## Settings & Preferences

### User-Configurable Privacy Options (TODO)
```typescript
type PrivacySettings = {
  dataRetention: 'indefinite' | '30days' | '7days';
  autoDeleteLeads: boolean;
  enableAnalytics: boolean;
  shareAnonymousUsage: boolean;
  encryptionEnabled: boolean;
}
```

## Support & Incidents

- **Contact**: [support email TBD]
- **Data Breach Response**: Immediate user notification + audit log review
- **Data Request (GDPR/CCPA)**: Process within 30 days

## Changelog

- **2025-01-07**: Initial version. Documented current data flows and recommended improvements.
