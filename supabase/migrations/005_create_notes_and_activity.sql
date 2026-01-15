-- Create portfolio_notes table
CREATE TABLE IF NOT EXISTS portfolio_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'insight', 'todo', 'alert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_portfolio_id ON portfolio_notes(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON portfolio_notes(user_id);
ALTER TABLE portfolio_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access notes in their portfolios"
    ON portfolio_notes FOR ALL
    USING (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    )
    WITH CHECK (
        user_id = current_user_id() OR
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = current_user_id())
    );

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_portfolio_id ON activity_log(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their activity"
    ON activity_log FOR SELECT
    USING (user_id = current_user_id());

-- Create offline_queue table for sync when back online
CREATE TABLE IF NOT EXISTS offline_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    data JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_offline_user_id ON offline_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_status ON offline_queue(status);
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their offline queue"
    ON offline_queue FOR ALL
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());

-- Helper function to get current user ID from JWT or session
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.uid()::text, session_user());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
