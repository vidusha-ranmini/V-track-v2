-- Temporary RLS bypass for custom authentication system
-- Run this in Supabase SQL Editor AFTER running the main schema

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users full access to roads" ON roads;
DROP POLICY IF EXISTS "Allow authenticated users full access to sub_roads" ON sub_roads;
DROP POLICY IF EXISTS "Allow authenticated users full access to sub_sub_roads" ON sub_sub_roads;
DROP POLICY IF EXISTS "Allow authenticated users full access to addresses" ON addresses;
DROP POLICY IF EXISTS "Allow authenticated users full access to households" ON households;
DROP POLICY IF EXISTS "Allow authenticated users full access to members" ON members;
DROP POLICY IF EXISTS "Allow authenticated users full access to businesses" ON businesses;
DROP POLICY IF EXISTS "Allow authenticated users full access to road_lamps" ON road_lamps;
DROP POLICY IF EXISTS "Allow authenticated users full access to deletion_log" ON deletion_log;

-- Create permissive policies for service role access
CREATE POLICY "Allow service role full access" ON roads FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON sub_roads FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON sub_sub_roads FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON addresses FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON households FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON members FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON businesses FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON road_lamps FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON deletion_log FOR ALL USING (true);