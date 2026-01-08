# CoreDNA Data Processing Flowcharts

For compliance teams and security audits.

---

## 1. Voice Processing Flow (Sonic Co-Pilot)

```
┌─────────────────────────────────────────────────────────────┐
│ USER SPEAKS: "Sonic, extract apple.com"                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  Browser (Client)    │
        │  Web Speech API      │
        └──────────┬───────────┘
                   │
        [Audio processed locally in browser]
        [Audio discarded after transcription]
                   │
                   ↓
        ┌──────────────────────────┐
        │ Transcription Text:      │
        │ "sonic extract apple.com"│
        └──────────┬───────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Send to Gemini API (encrypted HTTPS) │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ Gemini Intent Detection  │
        │ Response JSON:           │
        │ {intent, confidence}     │
        └──────────┬───────────────┘
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ Log to Supabase sonic_logs table     │
        │ (command text + metadata)            │
        │ Retention: 90 days                   │
        │ Auto-delete after 90 days            │
        └──────────┬───────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ Execute Command          │
        │ (extract/campaign/etc)   │
        └──────────┬───────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ Response to User         │
        │ Display in chat          │
        │ Speak via Text-to-Speech │
        └──────────────────────────┘
```

**Data Security:**
- ✅ Voice audio: Local only, never transmitted
- ✅ Transcription: HTTPS encrypted in transit
- ✅ API calls: Authenticated with API keys
- ✅ Storage: Encrypted at rest (Supabase)
- ✅ Deletion: Automatic after 90 days

---

## 2. Brand Extraction Flow

```
┌─────────────────────────────────────┐
│ USER REQUESTS: Extract apple.com    │
└──────────────┬──────────────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │ Permission Check         │
    │ - Tier verification      │
    │ - Extraction limit       │
    │ - Rate limiting          │
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────────────┐
    │ Fetch URL Content                │
    │ (Public content only)            │
    │ - Check robots.txt               │
    │ - Honor nofollow/noindex         │
    │ - Respect rate limiting          │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌──────────────────────────────────────┐
    │ Send to Selected AI Provider         │
    │ (Gemini / GPT-4 / Claude / etc)      │
    │ - User-selected (with consent)       │
    │ - Encrypted HTTPS                    │
    └──────────┬──────────────────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │ AI Analysis              │
    │ Extracts:                │
    │ - Brand identity         │
    │ - Values                 │
    │ - Messaging              │
    │ - Visual style           │
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────────────────┐
    │ Store Results in User Account        │
    │ - Supabase (encrypted)               │
    │ - User ownership                     │
    │ - Can be exported/downloaded         │
    └──────────┬──────────────────────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │ Log to Audit Trail           │
    │ - Who: user_id               │
    │ - What: extraction           │
    │ - When: timestamp            │
    │ - Where: URL                 │
    └──────────┬────────────────────┘
               │
               ↓
    ┌──────────────────────┐
    │ Return to User UI    │
    │ Display brand DNA    │
    └──────────────────────┘
```

**User Data Ownership:**
- ✅ Extracted data: User-owned
- ✅ NOT used for model training
- ✅ NOT shared with competitors
- ✅ Deleted on account closure
- ✅ User has export rights

---

## 3. Campaign Generation Flow

```
┌──────────────────────────────────┐
│ USER REQUESTS: Generate campaign │
└────────────┬──────────────────────┘
             │
             ↓
  ┌──────────────────────┐
  │ Permission Check     │
  │ - Pro+ tier only     │
  │ - Usage quota        │
  └────────┬─────────────┘
           │
           ↓
  ┌──────────────────────────┐
  │ Load Brand DNA           │
  │ From user account        │
  └────────┬─────────────────┘
           │
           ↓
  ┌──────────────────────────────────┐
  │ n8n Workflow Execution           │
  │ - Gemini: Copy writing           │
  │ - DALL-E: Image generation       │
  │ - Video API: Motion graphics     │
  └────────┬────────────────────────┘
           │
           ↓
  ┌──────────────────────────────────┐
  │ Consolidate Assets               │
  │ - Marketing copy                 │
  │ - Social media post graphics     │
  │ - Email templates                │
  │ - Blog article drafts            │
  └────────┬────────────────────────┘
           │
           ↓
  ┌──────────────────────────────┐
  │ Store in User Campaign        │
  │ - Editable by user            │
  │ - User ownership              │
  │ - Can schedule posts          │
  └────────┬─────────────────────┘
           │
           ↓
  ┌───────────────────────────────────┐
  │ Log Campaign Generation           │
  │ - User ID                         │
  │ - Templates used                  │
  │ - AI providers used               │
  │ - Generation time                 │
  └────────┬──────────────────────────┘
           │
           ↓
  ┌──────────────────────┐
  │ Return to User UI    │
  │ Display preview      │
  │ Allow edits          │
  └──────────────────────┘
```

**Content Licensing:**
- ✅ User owns generated content
- ✅ License from each AI provider (paid tier)
- ✅ Can reuse, modify, redistribute
- ✅ Attribution may be required (per license)
- ✅ CoreDNA never claims ownership

---

## 4. Third-Party Data Flow

```
┌────────────────────────────────────────┐
│ USER ACCOUNT & PROCESSING              │
└──────────┬─────────────────────────────┘
           │
    ┌──────┴──────┬─────────┬──────────┬─────────┐
    │             │         │          │         │
    ↓             ↓         ↓          ↓         ↓
┌────────┐  ┌──────────┐ ┌────┐  ┌────────┐  ┌──────┐
│Supabase│  │Gemini API│ │n8n │  │Vercel  │  │Stripe│
│(Data   │  │(Intent)  │ │    │  │(Deploy)│  │(Pay) │
│Storage)│  │          │ │    │  │        │  │      │
└────┬───┘  └────┬─────┘ └───┬┘  └───┬────┘  └──┬───┘
     │           │           │        │          │
     │           │           │        │          │
  ✅ RLS      ✅ DPA      ✅ DPA   ✅ DPA     ✅ PCI
  ✅ Encrypt  ✅ No      ✅ No    ✅ No      ✅ No
              training  training training    PII
```

**Data Processing Agreements:**
- ✅ All third parties under DPA
- ✅ Data processing for specified purpose only
- ✅ NO transfer to other companies
- ✅ NO use for model training (except LLM providers with explicit license)
- ✅ Compliance with GDPR Article 28

---

## 5. Data Retention & Deletion

```
DATA TYPE             RETENTION    DELETION METHOD
───────────────────────────────────────────────────
Voice Logs            90 days      Automatic (cron)
Command History       90 days      Automatic (cron)
Extracted Brand DNA   User-owned   User delete
Campaign Assets       User-owned   User delete
Website Data          User-owned   User delete
API Logs              30 days      Automatic
Audit Trail           1 year       Manual (admin)
User Account          Forever      User delete → 30-day grace
```

**Deletion Process:**
```
User clicks "Delete Account"
         ↓
30-day email: "Account scheduled for deletion"
         ↓
User can recover within 30 days
         ↓
Day 31: Automatic deletion
    - Extract brand data → Deleted
    - Campaign assets → Deleted
    - Website files → Deleted
    - Voice logs → Deleted
    - Account metadata → Deleted
    - Audit trail → Retained (1 year)
         ↓
Confirmation email sent
```

---

## 6. Consent & User Control Flow

```
┌─────────────────────────────────┐
│ USER SIGNUP                     │
└────────────┬────────────────────┘
             │
             ↓
  ┌─────────────────────────┐
  │ Show Privacy Policy     │
  │ (explicit link)         │
  │ "I agree" checkbox      │
  └────────┬────────────────┘
           │
           ↓
  ┌──────────────────────────┐
  │ Show AI Consent          │
  │ "We use Gemini API"      │
  │ "We use OpenAI (optional)│
  └────────┬─────────────────┘
           │
           ↓
  ┌──────────────────────────────┐
  │ Account Created              │
  │ Default: Sonic disabled      │
  │ Default: Standard providers  │
  └────────┬─────────────────────┘
           │
           ↓
  ┌──────────────────────────────────┐
  │ LATER: User Settings             │
  │ ☑ Enable Sonic Co-Pilot          │
  │ ☑ Consent to voice processing    │
  │ ☐ Consent to analytics           │
  │ [Select AI Provider]             │
  │ [Download My Data]               │
  │ [Delete My Account]              │
  └──────────────────────────────────┘
```

**Consent Tracking:**
- ✅ Timestamp of each consent
- ✅ IP address logged
- ✅ Browser/device information
- ✅ Can revoke anytime
- ✅ Retroactive withdrawal possible

---

## 7. Security & Encryption

```
USER INPUT
    ↓
┌────────────────────────────┐
│ CLIENT-SIDE ENCRYPTION     │
│ (TLS 1.3 HTTPS)            │
└────┬───────────────────────┘
     │
     ↓
┌────────────────────────────┐
│ IN TRANSIT                 │
│ - Encrypted tunnel         │
│ - Certificate pinning      │
│ - HSTS headers             │
└────┬───────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│ AT SUPABASE                    │
│ - Database encryption (PGCrypto)
│ - Row-level security (RLS)     │
│ - API key authentication       │
└────┬───────────────────────────┘
     │
     ↓
┌──────────────────────────┐
│ IN USE (MEMORY)          │
│ - No logging of raw data │
│ - Cleared after use      │
│ - No temp files          │
└──────────────────────────┘
```

---

## Compliance Teams

This document is for:
- Security audits
- Privacy impact assessments
- GDPR/CCPA compliance reviews
- SOC 2 attestations
- Data protection assessments

**Questions?** Contact: compliance@coredna.ai

---

**Last Updated:** January 2024
**Classification:** Internal (Authorized Only)
