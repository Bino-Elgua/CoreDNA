import { supabase } from './supabase';

export interface AffiliateVisitorData {
  ip: string;
  company: string;
  consent: {
    identification: boolean;
    marketing: boolean;
    sales: boolean;
  };
}

/**
 * Validate and track affiliate visit
 * - Self-scouting prevention
 * - Consent verification
 * - IP logging for compliance
 */
export async function validateAndTrackVisit(
  partnerSlug: string,
  visitorData: AffiliateVisitorData
): Promise<void> {
  try {
    // Get partner by slug
    const { data: partnerData } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('affiliate_slug', partnerSlug)
      .single();

    if (!partnerData) return;

    const partnerId = partnerData.user_id;

    // SELF-SCOUTING PREVENTION
    const visitorDomain = await reverseIpLookup(visitorData.ip);
    const { data: partnerProfile } = await supabase
      .from('user_settings')
      .select('company_domains')
      .eq('user_id', partnerId)
      .single();

    const partnerDomains = partnerProfile?.company_domains || [];
    if (visitorDomain && partnerDomains.includes(visitorDomain)) {
      await logSecurityEvent({
        partner_id: partnerId,
        type: 'self_scouting_blocked',
        visitor_domain: visitorDomain,
        timestamp: new Date().toISOString(),
      });
      return; // Block silently
    }

    // CONSENT VERIFICATION
    if (!visitorData.consent.identification) {
      return; // No consent, no tracking
    }

    // RECORD VISIT WITH CONSENT TIMESTAMP AND IP
    await supabase.from('affiliate_visitor_logs').insert({
      partner_id: partnerId,
      visitor_ip: visitorData.ip,
      visitor_company: visitorData.company,
      consented_to_identification: visitorData.consent.identification,
      consented_to_marketing: visitorData.consent.marketing,
      consented_to_sales: visitorData.consent.sales,
      consent_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Affiliate tracking error:', error);
  }
}

/**
 * Reverse IP lookup to detect self-scouting
 */
async function reverseIpLookup(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check`, {
      method: 'POST',
      headers: {
        Key: process.env.REACT_APP_ABUSEIPDB_KEY || '',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        ipAddress: ip,
        maxAgeInDays: '90',
      }),
    });

    const data = await response.json();
    return data.data?.usageType || null;
  } catch (error) {
    return null;
  }
}

/**
 * Log security events (self-scouting attempts, etc.)
 */
async function logSecurityEvent(event: any): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Store in analytics or security logs
    console.log('[SECURITY]', event);
  }
}

/**
 * Get visitor statistics for partner dashboard
 */
export async function getAffiliateStats(partnerId: string) {
  const { data: logs } = await supabase
    .from('affiliate_visitor_logs')
    .select('*')
    .eq('partner_id', partnerId)
    .order('timestamp', { ascending: false });

  if (!logs) return null;

  const stats = {
    totalVisitors: logs.length,
    identifiedCompanies: logs.filter(l => l.consented_to_identification).length,
    marketingConsent: logs.filter(l => l.consented_to_marketing).length,
    salesConsent: logs.filter(l => l.consented_to_sales).length,
    conversions: logs.filter(l => l.referral_converted).length,
    conversionRate: logs.length > 0 ? (logs.filter(l => l.referral_converted).length / logs.length) * 100 : 0,
  };

  return stats;
}

/**
 * Mark referral as converted (for commission tracking)
 */
export async function markReferralConverted(visitorLogId: string): Promise<void> {
  await supabase
    .from('affiliate_visitor_logs')
    .update({ referral_converted: true })
    .eq('id', visitorLogId);
}

/**
 * Process opt-out requests (background job)
 */
export async function processOptOutRequests(): Promise<void> {
  const { data: requests } = await supabase
    .from('affiliate_opt_out_requests')
    .select('*')
    .eq('processed', false);

  if (!requests) return;

  for (const request of requests) {
    // Delete or anonymize records matching the request
    if (request.email) {
      // Find and anonymize records
      await supabase
        .from('affiliate_visitor_logs')
        .update({
          visitor_ip: null,
          visitor_company: '[DELETED]',
          consented_to_identification: false,
          consented_to_marketing: false,
          consented_to_sales: false,
        })
        .match({ visitor_ip: request.visitor_ip });
    }

    // Mark as processed
    await supabase
      .from('affiliate_opt_out_requests')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', request.id);
  }
}

/**
 * Check if partner has accepted DPA
 */
export async function hasDPAAccepted(partnerId: string): Promise<boolean> {
  const { data } = await supabase
    .from('partner_dpa_acceptance')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('dpa_version', '1.0')
    .single();

  return !!data;
}

/**
 * Record DPA acceptance
 */
export async function recordDPAAcceptance(partnerId: string, ipAddress: string): Promise<void> {
  await supabase.from('partner_dpa_acceptance').insert({
    partner_id: partnerId,
    accepted_at: new Date().toISOString(),
    ip_address: ipAddress,
    dpa_version: '1.0',
  });
}
