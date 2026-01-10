# CoreDNA2 Extraction Testing Guide

## Current Status
✅ Fixed `trends.map is not a function` - `generateTrendPulse()` now returns `TrendPulseItem[]`
✅ Fixed `analyzeBrandDNA()` - returns proper `BrandDNA` object with all required fields

## API Call Flow

### 1. Brand DNA Extraction
**Entry:** ExtractPage.tsx line 48 → `handleExtractDNA()`
**Calls:** `analyzeBrandDNA(url, brandName)` from geminiService.ts
**Returns:** `BrandDNA` object

**Required Fields:**
- id, name, tagline, description, mission, elevatorPitch
- websiteUrl, detectedLanguage, createdAt
- values[], keyMessaging[]
- confidenceScores { visuals, strategy, tone, overall }
- colors[], fonts[]
- visualStyle { style, description }
- toneOfVoice { adjectives[], description }
- brandPersonality[], targetAudience
- personas[], swot {}, competitors[]

**Response Handling:**
- Line 57-64: Saves to localStorage['core_dna_profiles']
- Line 65-78: Catches errors, shows user-friendly alerts

### 2. Trend Pulse Generation
**Entry:** TrendPulse.tsx line 18 → `loadTrends()`
**Calls:** `generateTrendPulse(dna)` from geminiService.ts
**Returns:** `TrendPulseItem[]` 

**TrendPulseItem Structure:**
```typescript
{
  id: string;
  topic: string;
  relevanceScore: number (1-100);
  summary: string;
  suggestedAngle: string;
}
```

**Response Handling:**
- Line 28: Caches in localStorage with key `pulse_{dna.id}_{date}`
- Line 31: Maps trends to UI in line 75

### 3. Lead Finding
**Entry:** ExtractPage.tsx line 81 → `handleFindLeads()`
**Calls:** `findLeadsWithMaps(niche, latitude, longitude)` from geminiService.ts
**Returns:** `LeadProfile[]`

**LeadProfile Structure:**
```typescript
{
  id: string;
  name: string;
  address: string;
  rating?: number;
  website?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    socials?: { platform: string; url: string }[];
  };
  gapAnalysis: {
    missingWebsite: boolean;
    lowRating: boolean;
    socialSilence: boolean;
    opportunity: string;
    vulnerabilityDeepDive: string;
  };
}
```

### 4. Closer Agent Portfolio
**Entry:** ExtractPage.tsx line 137 → `handleGeneratePortfolio(lead)`
**Calls:** `runCloserAgent(lead, sender)` from geminiService.ts
**Returns:** `CloserPortfolio` object

## Testing Checklist

- [ ] API key configured in Settings (at least 1 LLM provider)
- [ ] Brand DNA extraction returns valid BrandDNA object
- [ ] Trend Pulse generates 3 TrendPulseItem objects
- [ ] Lead Hunter finds leads with full contact info
- [ ] Closer Agent creates portfolio with email + posts

## Error Handling
- API key missing → Alert + redirect to Settings
- Network error → User-friendly network error message
- JSON parse error → Fallback to minimal valid object
- Empty results → Show empty state UI
