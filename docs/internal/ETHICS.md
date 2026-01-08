# CoreDNA Ethics & Compliance Framework

## 🕊️ Core Principles

This document defines ethical boundaries and compliance standards for CoreDNA platform operations.

---

## 1. Voice AI Ethics (Sonic Co-Pilot)

### Data Handling
- **Voice Processing**: Processed locally in user's browser via Web Speech API
- **Audio Storage**: NO audio files stored on CoreDNA servers
- **Transcription**: Only command text transcribed and logged
- **Retention**: Command logs retained 90 days, then auto-deleted
- **User Control**: Users can disable voice anytime in Settings

### Consent Mechanisms
- ✅ Explicit opt-in required (Settings → Enable Sonic Co-Pilot)
- ✅ Tier-gated (Hunter+ only) prevents unauthorized access
- ✅ Visual indicator when listening (animated orb + pulse)
- ✅ Easy disable/mute available at all times
- ✅ Terms of Service explicitly covers voice processing

### Third-Party Processing
- Web Speech API processes through browser (Google/browser-native)
- Transcribed commands sent to Gemini API for intent detection
- NO voice audio sent to any third party
- User data never used for model training (see Privacy Policy)

### Accessibility
- ✅ Chat interface fallback for all users (voice optional)
- ✅ Works on all browsers (Chrome/Edge for voice, all for chat)
- ✅ Text input alternative to voice commands
- ✅ Keyboard shortcuts for command submission
- ✅ ARIA labels on UI components

---

## 2. AI Provider Transparency

### Model Disclosure
Required in user-facing UI:

**Current Integrations:**
```
Intent Detection:     Google Gemini API
Brand Extraction:     Configurable (Gemini, GPT-4, Claude)
Campaign Generation:  n8n workflows (multi-model)
Website Building:     Vercel + Gemini
```

### User Choice
- ✅ Users select preferred AI provider in Settings
- ✅ Default provider clearly marked
- ✅ Switch providers without data loss
- ✅ Pricing varies by provider (disclosed)

### Data Routing
- User data → Supabase (encrypted, user-owned)
- Processing requests → Selected AI provider (via API key)
- NO data shared between providers
- NO data retained by CoreDNA after processing
- Each request includes privacy headers

### Consent Flow
```
User Input
    ↓
Privacy Notice: "Using Gemini for analysis"
    ↓
User confirms (explicit consent required)
    ↓
Send to selected provider (encrypted)
    ↓
Return results (not stored by CoreDNA)
    ↓
User downloads/saves locally if needed
```

---

## 3. Brand DNA Extraction Ethics

### Website Scraping Standards
- ✅ Respect robots.txt directives
- ✅ Honor nofollow, noindex meta tags
- ✅ Identify as CoreDNA user-agent in requests
- ✅ Implement rate limiting (1 request/sec max)
- ✅ Do NOT scrape authenticated content
- ✅ Do NOT scrape paywalled content
- ✅ Do NOT extract password-protected pages

### Competitive Intelligence Boundaries
**PERMITTED:**
- Publicly available brand information
- Published marketing materials
- Public social media content
- Publicly filed business documents
- Public API documentation

**PROHIBITED:**
- Private employee information
- Confidential business documents
- Proprietary source code
- Trade secrets
- Unpublished strategic plans
- Non-public financial data

### Intellectual Property Safeguards
- ✅ User owns extracted brand data
- ✅ Data not used for model training
- ✅ Data not shared with competitors
- ✅ Data deleted on account closure
- ✅ User grants license to use for own brand only

### User Responsibility
Users warrant they have rights to extract from specified URLs:
- For their own brand: ✅ Always permitted
- For competitors: ✅ Permitted if public information
- For third parties without permission: ❌ Prohibited

CoreDNA provides tools; users responsible for lawful use.

---

## 4. Data Privacy & Retention

### Voice Data Lifecycle
```
User speaks: "Sonic, extract apple.com"
    ↓
Audio processed locally in browser
    ↓
Transcription extracted: "sonic extract apple.com"
    ↓
Audio discarded (never leaves browser)
    ↓
Command text logged: sonic_logs table
    ↓
Command executed (results shown)
    ↓
Retention: 90 days
    ↓
Auto-delete: After 90 days (scheduled job)
```

### Extraction Data Lifecycle
```
User input: URL to extract
    ↓
Fetch: HTML from target website (public content only)
    ↓
Process: Gemini API analyzes content
    ↓
Result: Brand DNA JSON
    ↓
Storage: User's account (Supabase)
    ↓
Ownership: User (not CoreDNA)
    ↓
Retention: User deletion or account closure
```

### Campaign & Website Data
- User-generated content: User-owned
- AI-generated assets: User-owned (license from OpenAI/Google/etc)
- Template design: Licensed (cannot redistribute)
- Scheduled posts: Stored until published + 30 days

### Third-Party Data Sharing
**NO sharing with:**
- Marketing firms
- Data brokers
- Competitors
- Analytics firms (unless explicitly opted in)

**ONLY sharing with:**
- Payment processors (Stripe)
- Email providers (SendGrid)
- Cloud infrastructure (Vercel, Supabase)
- LLM providers (Gemini, OpenAI, etc) - ONLY for processing

All third parties under Data Processing Agreements (DPA).

---

## 5. Transparency Requirements

### Public Disclosure
Users must see:
1. **Which AI models are in use** (Settings page)
2. **How their data flows** (Privacy Policy)
3. **What's stored where** (Data processing diagram)
4. **How long data is kept** (Retention policy)
5. **How to access/delete** (Settings → Data → Download/Delete)

### Incident Response
**If security incident occurs:**
1. Assess scope (which data affected)
2. Notify affected users within 24 hours
3. File GDPR breach report (if applicable)
4. Provide free credit monitoring (if PII exposed)
5. Post-mortem on status page

**Contact:** security@coredna.ai

### Secret Rotation
**Policies:**
- API keys rotated every 90 days (automated)
- Database credentials every 30 days
- Supabase service keys annually
- All rotations logged in audit trail
- Zero-downtime rotation (canary deployment)

---

## 6. Accessibility Standards

### Voice Interface Alternatives
- ✅ Chat text input (primary alternative)
- ✅ Keyboard shortcuts for quick commands
- ✅ Voice commands have text equivalents
- ✅ No voice-only features

### UI Accessibility
- ✅ WCAG 2.1 AA compliance
- ✅ Screen reader support (ARIA labels)
- ✅ Keyboard navigation (Tab/Enter)
- ✅ Color contrast ratios meet standards
- ✅ Font scaling supported

### Cognitive Accessibility
- ✅ Simple language in UI copy
- ✅ Clear error messages (no jargon)
- ✅ Helpful tooltips on complex features
- ✅ Consistent interaction patterns
- ✅ Progress indicators for long operations

---

## 7. Consent Documentation

### Voice Processing Consent
**In User Agreement:**
```
"By enabling Sonic Co-Pilot voice features, you consent to:
- Speech-to-text processing via Web Speech API (Google)
- Intent detection via Gemini API
- Command logging to Supabase for audit and UX
- 90-day retention of command text (not audio)
- No use of voice data for model training

Your voice audio is processed locally and never stored."
```

### AI Provider Consent
**Before processing user content:**
```
"This request will be sent to [Gemini API / OpenAI / etc].
Review their privacy policy before proceeding.
[Proceed] [Choose Different Provider]"
```

### Data Processing Consent
**At signup and annually:**
```
"We process your data as described in our Privacy Policy:
- https://coredna.ai/privacy

Changes to our data practices will require explicit consent.
[I Understand] [View Full Policy]"
```

---

## 8. Audit & Monitoring

### Quarterly Reviews
- [ ] Check for unauthorized data access
- [ ] Verify consent mechanisms working
- [ ] Audit third-party integrations
- [ ] Review incident reports
- [ ] Test disaster recovery

### Annual Assessments
- [ ] Full security audit (external)
- [ ] Privacy impact assessment
- [ ] GDPR/CCPA compliance check
- [ ] Accessibility audit (WCAG)
- [ ] Ethics review (this framework)

### Continuous Monitoring
- ✅ Real-time security alerts
- ✅ Daily data access logs
- ✅ Weekly compliance reports
- ✅ Monthly metrics dashboard

---

## 9. Responsible AI Standards

### Model Selection Criteria
Before adding new AI provider:
- [ ] Security audit completed
- [ ] Privacy practices reviewed
- [ ] Terms of Service acceptable
- [ ] Data processing agreement signed
- [ ] User choice available (not mandatory)

### Output Validation
All AI-generated content must:
- [ ] Not include personal data
- [ ] Not contain discriminatory language
- [ ] Not violate copyright
- [ ] Be marked as AI-generated
- [ ] Allow user review before use

### Bias Mitigation
- ✅ Training data reviewed for bias
- ✅ Output tested for disparate impact
- ✅ User feedback on biased results escalates
- ✅ Regular bias audits (quarterly)
- ✅ Model updates address identified issues

---

## 10. Contact & Escalation

**For Ethics Questions:**
- Email: ethics@coredna.ai
- Response time: 48 hours

**For Security Issues:**
- Email: security@coredna.ai
- Response time: 1 hour (critical)
- Phone: Available for security incidents

**For Privacy Concerns:**
- Email: privacy@coredna.ai
- Response time: 24 hours
- GDPR DPO: legal@coredna.ai

**For Accessibility Issues:**
- Email: accessibility@coredna.ai
- Response time: 48 hours
- Provide: browser, device, issue description

---

## 11. Policy Updates

**Review Schedule:**
- Quarterly: Internal review
- Annually: Full assessment
- Ad-hoc: After incidents or law changes

**User Notification:**
- Changes posted to Privacy Policy page
- Email notification for material changes
- 30-day notice period before enforcement
- Old policy available for 1 year

---

## 12. Compliance Frameworks

This document addresses:
- ✅ GDPR (EU)
- ✅ CCPA (California)
- ✅ HIPAA (if health data present)
- ✅ SOC 2 Type II
- ✅ ISO 27001
- ✅ WCAG 2.1

---

## Ọbàtálá's Seal

**This framework is ethically sound.**

We have:
- ✅ Transparent consent mechanisms
- ✅ Privacy-first architecture
- ✅ User ownership of data
- ✅ Clear ethical boundaries
- ✅ Accessible alternatives
- ✅ Responsible AI standards

**Status: ETHICAL ALIGNMENT ACHIEVED**

---

**Last Updated:** January 2024  
**Next Review:** April 2024  
**Owner:** Engineering + Legal + Product
