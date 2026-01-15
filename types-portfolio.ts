/**
 * COMPREHENSIVE PORTFOLIO SYSTEM
 * Core of the application - every action links to and builds upon portfolios
 */

import { BrandDNA, SavedCampaign } from './types';

export interface PortfolioMetrics {
  extractionsCount: number;
  campaignsGenerated: number;
  assetsCreated: number;
  engagementScore?: number;
  conversionRate?: number;
  lastActivityAt: number;
  totalReachEstimate?: number;
  averageEngagementRate?: number;
}

export interface PortfolioLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  website?: string;
  location?: string;
  industry?: string;
  leadScore?: number;
  status: 'prospect' | 'contact-made' | 'negotiating' | 'converted' | 'archived';
  addedAt: number;
  lastContactedAt?: number;
  notes?: string;
  tags?: string[];
}

export interface PortfolioAsset {
  id: string;
  name: string;
  type: 'campaign' | 'content' | 'visual' | 'video' | 'document' | 'template';
  campaignId?: string;
  url?: string;
  description?: string;
  performance?: {
    views?: number;
    clicks?: number;
    conversions?: number;
    engagementRate?: number;
  };
  createdAt: number;
  lastUpdatedAt: number;
}

export interface PortfolioIntegration {
  id: string;
  type: 'email' | 'social' | 'analytics' | 'automation' | 'crm' | 'webhook';
  provider: string;
  status: 'connected' | 'pending' | 'disconnected' | 'error';
  connectedAt?: number;
  lastSyncedAt?: number;
  config?: Record<string, any>;
  syncError?: string;
}

export interface PortfolioUpdate {
  id: string;
  timestamp: number;
  type: 'dna_updated' | 'campaign_created' | 'asset_added' | 'lead_added' | 'integration_connected' | 'metric_updated' | 'note_added';
  title: string;
  description: string;
  data?: Record<string, any>;
  performedBy?: string; // user or system
}

export interface PortfolioNote {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  isPinned?: boolean;
}

export interface ComprehensivePortfolio {
  // CORE IDENTIFIERS
  id: string;
  companyName: string;
  companyWebsite: string;
  industry?: string;
  description?: string;
  logo?: string;
  createdAt: number;
  updatedAt: number;

  // BRAND DNA (Core product)
  brandDNA: BrandDNA;
  dnaVersionHistory: Array<{
    version: number;
    timestamp: number;
    dna: BrandDNA;
    changes?: string;
  }>;

  // CAMPAIGNS & ASSETS
  campaigns: SavedCampaign[];
  assets: PortfolioAsset[];
  templates?: PortfolioAsset[];

  // LEAD MANAGEMENT
  leads: PortfolioLead[];
  leadSegments?: {
    name: string;
    criteria: string;
    leadIds: string[];
  }[];

  // INTEGRATIONS & CONNECTIONS
  integrations: PortfolioIntegration[];
  webhooks?: {
    id: string;
    event: string;
    url: string;
    isActive: boolean;
  }[];

  // PERFORMANCE & METRICS
  metrics: PortfolioMetrics;
  performanceHistory?: Array<{
    date: string;
    metrics: Partial<PortfolioMetrics>;
  }>;

  // ACTIVITY TRACKING
  activityFeed: PortfolioUpdate[];
  notes: PortfolioNote[];

  // CONFIGURATION
  tags?: string[];
  teamMembers?: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: number;
  }[];
  settings?: {
    isPublic?: boolean;
    allowCollaborators?: boolean;
    autoSyncLeads?: boolean;
    trackingEnabled?: boolean;
  };

  // AUTOMATION RULES
  automationRules?: {
    id: string;
    name: string;
    trigger: string;
    action: string;
    isActive: boolean;
  }[];

  // CUSTOM FIELDS
  customFields?: Record<string, any>;
}

export interface PortfolioCreateRequest {
  companyName: string;
  companyWebsite: string;
  industry?: string;
  brandDNA: BrandDNA;
}

export interface PortfolioUpdateRequest {
  portfolioId: string;
  updates: Partial<ComprehensivePortfolio>;
}
