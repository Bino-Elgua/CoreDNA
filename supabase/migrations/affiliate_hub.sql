-- Affiliate Hub Schema with DPA, visitor logs, and opt-out management
-- Phase 5: Complete database schema

-- Affiliate visitor logs with tiered consent
CREATE TABLE IF NOT EXISTS affiliate_visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES auth.users(id) NOT NULL,
  visitor_ip INET,
  visitor_company TEXT,
  consented_to_identification BOOLEAN DEFAULT false,
  consented_to_marketing BOOLEAN DEFAULT false,
  consented_to_sales BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  referral_converted BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partner DPA acceptance log
CREATE TABLE IF NOT EXISTS partner_dpa_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES auth.users(id) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  dpa_version TEXT NOT NULL DEFAULT '1.0',
  UNIQUE(partner_id, dpa_version)
);

-- Opt-out requests
CREATE TABLE IF NOT EXISTS affiliate_opt_out_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug TEXT,
  email TEXT,
  company_name TEXT,
  visitor_ip INET,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- RLS policies
ALTER TABLE affiliate_visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own affiliate logs"
ON affiliate_visitor_logs FOR SELECT
USING (auth.uid() = partner_id);

ALTER TABLE partner_dpa_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own DPA acceptance"
ON partner_dpa_acceptance FOR SELECT
USING (auth.uid() = partner_id);

ALTER TABLE affiliate_opt_out_requests ENABLE ROW LEVEL SECURITY;

-- Public insert allowed for opt-out, admin view only

-- Indexes
CREATE INDEX idx_affiliate_logs_partner ON affiliate_visitor_logs(partner_id);
CREATE INDEX idx_affiliate_logs_consent ON affiliate_visitor_logs(consent_timestamp);
CREATE INDEX idx_dpa_partner ON partner_dpa_acceptance(partner_id);
CREATE INDEX idx_opt_out_processed ON affiliate_opt_out_requests(processed);
