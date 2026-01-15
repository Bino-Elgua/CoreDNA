-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    campaign_data JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_portfolio_id ON campaigns(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access campaigns in their portfolios"
    ON campaigns FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );

-- Create portfolio_leads table
CREATE TABLE IF NOT EXISTS portfolio_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    lead_name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    lead_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_portfolio_id ON portfolio_leads(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON portfolio_leads(user_id);
ALTER TABLE portfolio_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access leads in their portfolios"
    ON portfolio_leads FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );

-- Create portfolio_assets table
CREATE TABLE IF NOT EXISTS portfolio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    asset_url TEXT,
    asset_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_portfolio_id ON portfolio_assets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON portfolio_assets(user_id);
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access assets in their portfolios"
    ON portfolio_assets FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );
