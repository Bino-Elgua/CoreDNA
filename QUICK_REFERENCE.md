# Quick Reference - CoreDNA 2.0

## Get Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## Main Features

| Feature | Location | Route |
|---------|----------|-------|
| **Dashboard** | `pages/DashboardPageV2.tsx` | `/` or `/dashboard` |
| **Portfolio** | `pages/PortfolioPage.tsx` | `/portfolio/:id` |
| **Extract** | `pages/ExtractPage.tsx` | `/extract` |
| **Campaigns** | `pages/CampaignsPage.tsx` | `/campaigns` |
| **Settings** | `pages/SettingsPage.tsx` | `/settings` |

---

## Key Services

### Portfolio Management
```typescript
import { 
  getPortfolios,
  createPortfolio,
  deletePortfolio,
  updatePortfolio,
  getPortfolioStats
} from './services/portfolioService';
```

### Data Migration
```typescript
import {
  getAllPortfolioData,
  migrateOldProfiles,
  saveDNAAsPortfolio
} from './services/dataFlowService';
```

### AI Integration
```typescript
import { generateWithGemini } from './services/geminiService';
import { generateTrendPulse } from './services/geminiService';
```

---

## Storage Keys

```javascript
localStorage.getItem('core_dna_portfolios')     // Main data
localStorage.getItem('core_dna_profiles')       // Legacy (migration)
localStorage.getItem('core_dna_settings')       // API keys & settings
```

---

## Common Tasks

### Delete a Portfolio
```typescript
const success = deletePortfolio(portfolioId);
// Automatically removes from localStorage
// Manual refresh: setPortfolios(getPortfolios())
```

### Create a Portfolio
```typescript
const portfolio = createPortfolio({
  companyName: "Acme Corp",
  companyWebsite: "https://acme.com",
  industry: "Tech",
  brandDNA: {...}
});
```

### Add Campaign
```typescript
const updated = addCampaignToPortfolio(portfolioId, campaign);
```

---

## File Structure

```
📂 CoreDNA2-work
 ├── 📂 pages/         (17 files) - Page components
 ├── 📂 components/    (23 files) - Reusable components
 ├── 📂 services/      (42 files) - Business logic
 ├── 📂 contexts/               - Context providers
 ├── 📂 hooks/                  - Custom hooks
 ├── App.tsx                    - Router
 ├── index.tsx                  - Entry
 ├── types.ts                   - Types
 └── package.json
```

---

## Types

### Portfolio
```typescript
interface ComprehensivePortfolio {
  id: string;
  companyName: string;
  companyWebsite?: string;
  industry: string;
  brandDNA: BrandDNA;
  campaigns: SavedCampaign[];
  leads: PortfolioLead[];
  assets: PortfolioAsset[];
  notes: PortfolioNote[];
  createdAt: number;
  updatedAt: number;
  // ... more fields
}
```

### Brand DNA
```typescript
interface BrandDNA {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  coreValues: string[];
  targetAudience: string;
  colors: ColorPalette[];
  // ... more fields
}
```

---

## Debug Tips

### Check Console
```javascript
// In browser DevTools → Console

// List all portfolios
JSON.parse(localStorage.getItem('core_dna_portfolios'))

// Check settings
JSON.parse(localStorage.getItem('core_dna_settings'))

// Clear data
localStorage.clear()
```

### Enable Debug Logs
Most services log with `[serviceName]` prefix:
- `[portfolioService]` - Portfolio operations
- `[dataFlowService]` - Data sync
- `[geminiService]` - AI calls
- `[Dashboard]` - Dashboard-specific

---

## Common Issues

### Delete Not Working
1. Open DevTools (F12)
2. Go to Console
3. Click delete
4. Look for `[Dashboard] Delete result:` log
5. Report result

### Portfolio Not Saving
1. Check: `localStorage.getItem('core_dna_portfolios')`
2. Look for console errors
3. Verify API keys in settings

### Import Errors
- Check that files are in `pages/`, `components/`, or `services/`
- No longer look in `src/` directory (removed)
- Import path: `from './services/...'` (root level)

---

## Documentation

- `README.md` - Overview
- `FINAL_CLEANUP_REPORT.md` - What changed
- `TEST_DELETE.md` - Testing guide
- `REPOSITORY_STATUS.md` - Full status

---

## Need Help?

1. Check console logs with `[ServiceName]` prefix
2. Read FINAL_CLEANUP_REPORT.md for recent changes
3. See TEST_DELETE.md for testing procedures
4. Review REPOSITORY_STATUS.md for architecture
