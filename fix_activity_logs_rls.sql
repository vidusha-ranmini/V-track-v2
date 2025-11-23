-- Fix Row Level Security for user_activity_logs table
-- Run this in your Supabase SQL Editor

-- First, let's drop the existing policies
DROP POLICY IF EXISTS "Admin can view all activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON user_activity_logs;

-- Create new policies that work properly

-- Policy 1: Allow anyone to insert activity logs (for system logging)
CREATE POLICY "Allow system to insert activity logs" 
ON user_activity_logs FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy 2: Allow service role to insert activity logs (for server-side logging)
CREATE POLICY "Allow service role to insert activity logs" 
ON user_activity_logs FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Policy 3: Allow service role to select all activity logs (for API queries)
CREATE POLICY "Allow service role to select all activity logs" 
ON user_activity_logs FOR SELECT 
TO service_role 
USING (true);

-- Policy 4: Allow authenticated users to view activity logs (for frontend)
CREATE POLICY "Allow authenticated users to view activity logs" 
ON user_activity_logs FOR SELECT 
TO authenticated 
USING (true);

-- Alternative: If you want to completely disable RLS for this table (less secure but simpler)
-- Uncomment the line below if the above policies don't work:
-- ALTER TABLE user_activity_logs DISABLE ROW LEVEL SECURITY;