-- User Activity Logs Table
-- Add this to your database schema

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('login', 'logout', 'create', 'update', 'delete', 'view', 'export')),
    resource_type TEXT, -- e.g., 'member', 'household', 'business', 'road', etc.
    resource_id TEXT, -- ID of the resource being acted upon
    description TEXT, -- Human readable description of the action
    ip_address INET,
    user_agent TEXT,
    metadata JSONB, -- Store additional context data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_username ON user_activity_logs(username);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_resource ON user_activity_logs(resource_type, resource_id);

-- Row Level Security
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view all activity logs
CREATE POLICY "Admin can view all activity logs" 
ON user_activity_logs FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Only system can insert activity logs
CREATE POLICY "System can insert activity logs" 
ON user_activity_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);