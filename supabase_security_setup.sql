-- Additional Security Setup for Village Management System
-- Run this AFTER the main schema

-- Create a function to check if user is admin (customize this based on your auth setup)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
    -- For now, allow all authenticated users
    -- You can customize this later for more specific admin checks
    RETURN auth.uid() IS NOT NULL;
END;
$$ language plpgsql SECURITY DEFINER;

-- Update RLS policies to use the admin check function
DROP POLICY IF EXISTS "Allow authenticated users full access to roads" ON roads;
CREATE POLICY "Allow admin users full access to roads" ON roads
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to sub_roads" ON sub_roads;
CREATE POLICY "Allow admin users full access to sub_roads" ON sub_roads
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to sub_sub_roads" ON sub_sub_roads;
CREATE POLICY "Allow admin users full access to sub_sub_roads" ON sub_sub_roads
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to addresses" ON addresses;
CREATE POLICY "Allow admin users full access to addresses" ON addresses
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to households" ON households;
CREATE POLICY "Allow admin users full access to households" ON households
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to members" ON members;
CREATE POLICY "Allow admin users full access to members" ON members
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to businesses" ON businesses;
CREATE POLICY "Allow admin users full access to businesses" ON businesses
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to road_lamps" ON road_lamps;
CREATE POLICY "Allow admin users full access to road_lamps" ON road_lamps
    FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Allow authenticated users full access to deletion_log" ON deletion_log;
CREATE POLICY "Allow admin users full access to deletion_log" ON deletion_log
    FOR ALL USING (is_admin_user());