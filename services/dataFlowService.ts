/**
 * DATA FLOW SERVICE
 * Ensures all extracted brands, campaigns, and leads flow into portfolios
 * Single source of truth: Portfolio Service + localStorage
 */

import { BrandDNA } from '../types';
import { ComprehensivePortfolio, PortfolioCreateRequest } from '../types-portfolio';
import { createPortfolio, addCampaignToPortfolio, addLeadsToPortfolio, getPortfolios } from './portfolioService';

/**
 * Convert a BrandDNA to a Portfolio
 * Called after successful extraction
 */
export const convertDNAToPortfolio = (dna: BrandDNA, companyWebsite?: string): ComprehensivePortfolio => {
  const request: PortfolioCreateRequest = {
    companyName: dna.name,
    companyWebsite: companyWebsite || dna.websiteUrl || '',
    industry: dna.targetAudience,
    brandDNA: dna,
  };

  return createPortfolio(request);
};

/**
 * Save extracted DNA to portfolios system
 * This is called after extraction completes
 */
export const saveDNAAsPortfolio = (dna: BrandDNA, companyWebsite?: string): string => {
  const portfolio = convertDNAToPortfolio(dna, companyWebsite);
  console.log('[dataFlowService] ✓ Saved DNA as portfolio:', portfolio.id);
  return portfolio.id;
};

/**
 * Sync old core_dna_profiles to new portfolios system
 * Call this on app startup to migrate legacy data
 */
export const migrateOldProfiles = (): number => {
  try {
    const oldProfiles = localStorage.getItem('core_dna_profiles');
    if (!oldProfiles) return 0;

    const profiles: BrandDNA[] = JSON.parse(oldProfiles);
    const existing = getPortfolios();
    let migrated = 0;

    profiles.forEach(dna => {
      // Check if already exists
      const alreadyExists = existing.some(p => p.brandDNA.id === dna.id);
      if (!alreadyExists && dna.name) {
        try {
          saveDNAAsPortfolio(dna);
          migrated++;
        } catch (e) {
          console.error('[dataFlowService] Failed to migrate profile:', dna.name, e);
        }
      }
    });

    console.log(`[dataFlowService] ✓ Migrated ${migrated} profiles from legacy format`);
    return migrated;
  } catch (e) {
    console.error('[dataFlowService] Migration failed:', e);
    return 0;
  }
};

/**
 * Get all portfolio data including legacy profiles
 * Returns combined list of real portfolios + migrated legacy data
 */
export const getAllPortfolioData = (): ComprehensivePortfolio[] => {
  const portfolios = getPortfolios();
  
  // Ensure legacy data is migrated
  const legacyCount = migrateOldProfiles();
  if (legacyCount > 0) {
    return getPortfolios(); // Return updated list after migration
  }

  return portfolios;
};

/**
 * Verify portfolio was created and saved
 */
export const verifyPortfolioSaved = (portfolioId: string): boolean => {
  const portfolios = getPortfolios();
  return portfolios.some(p => p.id === portfolioId);
};

/**
 * Debug: Get localStorage stats
 */
export const getStorageStats = () => {
  const portfolios = getPortfolios();
  const legacyProfiles = localStorage.getItem('core_dna_profiles');
  
  return {
    portfoliosCount: portfolios.length,
    legacyProfilesCount: legacyProfiles ? JSON.parse(legacyProfiles).length : 0,
    totalPortfolios: portfolios.length,
    storageSize: new Blob([JSON.stringify(localStorage)]).size,
  };
};

/**
 * Clean up old duplicate data
 */
export const cleanupOldData = (): void => {
  try {
    // Only keep latest 3 campaigns per portfolio
    const portfolios = getPortfolios();
    portfolios.forEach(p => {
      if (p.campaigns.length > 10) {
        p.campaigns = p.campaigns.slice(0, 10);
      }
    });

    localStorage.setItem('core_dna_portfolios', JSON.stringify(portfolios));
    console.log('[dataFlowService] ✓ Cleaned up old data');
  } catch (e) {
    console.error('[dataFlowService] Cleanup failed:', e);
  }
};
