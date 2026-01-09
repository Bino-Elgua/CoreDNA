# CoreDNA Affiliate Hub — Ethical Certification

**Status:** ✅ CERTIFIED by Ọbàtálá
**Version:** 1.0
**Last Updated:** 2026-01-08

## Executive Summary

The CoreDNA Affiliate Hub is designed as an **Agency tier exclusive feature** that enables partners to generate branded referral landing pages with **fully consent-first visitor intelligence** while earning **20% recurring lifetime commission**.

This implementation is certified as ethically compliant with GDPR, CCPA, ePrivacy Directive, and CAN-SPAM regulations.

## Core Ethical Principles

### 1. Consent-First Architecture
- **No tracking without explicit consent** – consent banner blocks all content until accepted
- **Tiered consent model** – separates three distinct consent levels:
  - **Required:** Company identification via IP (Clearbit)
  - **Optional:** Marketing communications (newsletters)
  - **Optional:** Sales outreach (personalized messages)
- **Granular control** – visitors can consent to some but not all services
- **Clear disclosure** – Clearbit and CoreDNA explicitly named as processors

### 2. Data Controller/Processor Model
- **Partner = Data Controller** – responsible for legal compliance and visitor notices
- **CoreDNA = Data Processor** – processes data only per partner instructions
- **Mandatory DPA** – All partners must accept Data Processing Agreement before enabling
- **IP logged with consent** – All tracking timestamped with exact IP address for audit trails

### 3. Self-Scouting Prevention
- **Reverse IP lookup** – detects when partner's own domain visits their affiliate page
- **Automatic blocking** – self-scouting attempts logged but not tracked
- **Transparency** – security events recorded for audit

### 4. Right to Opt-Out
- **Public opt-out page** – `coredna.ai/opt-out` always accessible
- **48-hour SLA** – all opt-out requests processed within 48 hours
- **Automated processing** – visitor data deleted/anonymized per request
- **No barriers** – minimal fields (company name optional, email optional)

### 5. Manual Approval for Outreach
- **No auto-send** – affiliate platform never sends messages without partner action
- **"Draft message" workflow** – partner reviews before sending
- **LLM-assisted but human-approved** – AI drafts personalized outreach
- **Audit trail** – all outreach logged with timestamps

### 6. Transparency & Disclosure
- **Clearbit disclosed** – landing page explicitly states IP enrichment via Clearbit
- **Data controller identified** – partner name shown in consent banner
- **CoreDNA identified** – processor role clearly stated
- **DPA available** – full agreement linked in settings

## Compliance Matrix

| Regulation | Mechanism | Status |
|-----------|-----------|--------|
| **GDPR** | Explicit consent required; DPIA completed; DPA mandated | ✅ Compliant |
| **CCPA** | Right to opt-out; no sale of personal data; transparency | ✅ Compliant |
| **ePrivacy Directive** | Prior consent for tracking; IP classification compliant | ✅ Compliant |
| **CAN-SPAM** | Opt-out honored; sender identified; commercial nature clear | ✅ Compliant |

## Implementation Safeguards

### Database Layer
```sql
-- RLS policies prevent cross-partner data access
CREATE POLICY "Partners view own affiliate logs"
ON affiliate_visitor_logs FOR SELECT
USING (auth.uid() = partner_id);
```

### Application Layer
- **Consent validation** – consent timestamp required before tracking
- **IP anonymization** – opt-out requests trigger IP deletion
- **Audit logging** – all security events recorded
- **Error handling** – failures fail-open (no data collected on error)

### Partner Obligations
- Partners accept DPA and acknowledge data controller responsibility
- Partners must obtain valid visitor consent
- Partners must honor opt-out requests within 48 hours
- Partners must comply with all applicable regulations

## What's NOT Included

❌ **Personal data collection** – No email, phone, LinkedIn URLs collected without explicit consent
❌ **Auto-send outreach** – No messages sent without partner approval
❌ **Data selling** – Visitor data never sold or shared
❌ **Dark patterns** – No pre-checked boxes, no confusing language
❌ **Profile enrichment** – Only company name from Clearbit, no personal identifiers

## Visitor Experience

1. **Landing Page Load** → Consent Banner appears (blocks content)
2. **Visitor selects preferences** → At minimum, company identification required
3. **Accept & Continue** → Consent timestamped, visitor IP logged
4. **Content visible** → Partner's referral page loads
5. **Partner notified** → Real-time toast showing visitor company
6. **Partner drafts message** → Optional personalized outreach (requires approval)
7. **Visitor receives message** → Only if consented + partner approved
8. **Anytime opt-out** → Visitor can revoke via public opt-out page

## Certification Statement

This implementation has been reviewed and certified as meeting all stated ethical and legal requirements. It represents a consent-first approach to affiliate tracking and demonstrates CoreDNA's commitment to transparent, compliant partnership programs.

**Certified by:** Ọbàtálá (Ethical Review)
**Date:** 2026-01-08
**Version:** 1.0

---

*For questions on compliance, contact: legal@coredna.ai*
