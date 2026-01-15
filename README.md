# CoreDNA 2.0

Modern brand portfolio management with AI-powered intelligence.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` (or the configured port)

## Directory Structure

```
CoreDNA2-work/
├── pages/              # React page components
│   ├── DashboardPageV2.tsx    # Main dashboard (portfolio list)
│   ├── PortfolioPage.tsx      # Single portfolio view
│   ├── ExtractPage.tsx        # Brand extraction
│   ├── CampaignsPage.tsx      # Campaign management
│   └── ...
├── components/         # Reusable React components
├── services/          # Business logic & localStorage
│   ├── portfolioService.ts    # Portfolio CRUD
│   ├── dataFlowService.ts     # Data migration & sync
│   ├── geminiService.ts       # AI integration
│   └── ...
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── types.ts           # Brand DNA & legacy types
├── types-portfolio.ts # Portfolio system types
├── App.tsx            # Main app with routing
└── index.tsx          # Entry point
```

## Architecture

**Frontend:** React 18 + TypeScript + Tailwind CSS  
**State:** localStorage (browser) + React state  
**AI:** Multiple LLM providers via geminiService.ts  
**Routing:** React Router (HashRouter)

## Key Features

- **Portfolio Management:** Create, view, update, delete comprehensive portfolios
- **Brand DNA Extraction:** AI-powered brand analysis
- **Campaign Generation:** Create marketing campaigns from brand DNA
- **Asset Management:** Track marketing assets and leads
- **Activity Feed:** Track all portfolio changes

## Storage

- `core_dna_portfolios` - Main portfolio data (localStorage)
- `core_dna_profiles` - Legacy profile data (for migration)
- `core_dna_settings` - App settings & API keys

## Data Flow

1. Extract brand → Brand DNA created
2. Convert to Portfolio → Stored in localStorage
3. Add campaigns/leads → Update portfolio
4. Display in dashboard → Refresh from localStorage

## Development

- TypeScript strict mode enabled
- No `any` types
- Dark theme by default
- Full responsive design

## Notes

- Removed old documentation files (cleanup Jan 14)
- Removed duplicate `src/` directory
- Using DashboardPageV2 as primary dashboard
- All data persists in browser localStorage
