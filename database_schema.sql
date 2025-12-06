-- Village Data Management System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create tables

-- Roads table
CREATE TABLE IF NOT EXISTS roads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Sub Roads table
CREATE TABLE IF NOT EXISTS sub_roads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(name, road_id)
);

-- Sub Sub Roads table
CREATE TABLE IF NOT EXISTS sub_sub_roads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    parent_sub_road_id UUID REFERENCES sub_roads(id) ON DELETE CASCADE,
    development_status TEXT CHECK (development_status IN ('developed', 'undeveloped')) DEFAULT 'undeveloped',
    width DECIMAL(8,2) DEFAULT 25.0,
    height DECIMAL(8,2) DEFAULT 10.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(name, parent_sub_road_id, width, height)
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    member TEXT,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    sub_road_id UUID REFERENCES sub_roads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(address, road_id, sub_road_id)
);

-- Households table
CREATE TABLE IF NOT EXISTS households (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address_id UUID REFERENCES addresses(id) ON DELETE CASCADE,
    assessment_number TEXT,
    resident_type TEXT CHECK (resident_type IN ('permanent', 'rent')) NOT NULL,
    waste_disposal TEXT CHECK (waste_disposal IN ('local_council', 'home')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    name_with_initial TEXT NOT NULL,
    member_type TEXT CHECK (member_type IN ('permanent', 'temporary')) DEFAULT 'permanent',
    nic TEXT NOT NULL UNIQUE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    occupation TEXT NOT NULL,
    workplace TEXT,
    school_name TEXT,
    grade INTEGER CHECK (grade >= 1 AND grade <= 13),
    university_name TEXT,
    other_occupation TEXT,
    offers_receiving TEXT[],
    is_disabled BOOLEAN DEFAULT FALSE,
    land_house_status TEXT CHECK (land_house_status IN ('plot_of_land', 'no_house', 'no_house_and_land')),
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name TEXT NOT NULL,
    business_owner TEXT NOT NULL,
    business_type TEXT NOT NULL,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    sub_road_id UUID REFERENCES sub_roads(id) ON DELETE CASCADE,
    address_id UUID REFERENCES addresses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Road Lamps table
CREATE TABLE IF NOT EXISTS road_lamps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lamp_number TEXT NOT NULL UNIQUE,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    sub_road_id UUID REFERENCES sub_roads(id) ON DELETE CASCADE,
    address_id UUID REFERENCES addresses(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('working', 'broken')) DEFAULT 'working',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Deletion Log table for audit trail
CREATE TABLE IF NOT EXISTS deletion_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    admin_user TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_roads_road_id ON sub_roads(road_id);
CREATE INDEX IF NOT EXISTS idx_addresses_road_sub_road ON addresses(road_id, sub_road_id);
CREATE INDEX IF NOT EXISTS idx_households_address_id ON households(address_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_nic ON members(nic);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(road_id, sub_road_id, address_id);
CREATE INDEX IF NOT EXISTS idx_road_lamps_location ON road_lamps(road_id, sub_road_id, address_id);

-- Enable Row Level Security on all tables
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_sub_roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_lamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow all operations for authenticated users only)
-- You should configure these policies based on your authentication setup

-- Roads policies
CREATE POLICY "Allow authenticated users full access to roads" ON roads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Sub Roads policies
CREATE POLICY "Allow authenticated users full access to sub_roads" ON sub_roads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Sub Sub Roads policies
CREATE POLICY "Allow authenticated users full access to sub_sub_roads" ON sub_sub_roads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Addresses policies
CREATE POLICY "Allow authenticated users full access to addresses" ON addresses
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Households policies
CREATE POLICY "Allow authenticated users full access to households" ON households
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Members policies
CREATE POLICY "Allow authenticated users full access to members" ON members
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Businesses policies
CREATE POLICY "Allow authenticated users full access to businesses" ON businesses
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Road Lamps policies
CREATE POLICY "Allow authenticated users full access to road_lamps" ON road_lamps
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Deletion Log policies
CREATE POLICY "Allow authenticated users full access to deletion_log" ON deletion_log
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create function for auto-updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_road_lamps_updated_at BEFORE UPDATE ON road_lamps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for annual grade increment (run every January 1st)
CREATE OR REPLACE FUNCTION increment_student_grades()
RETURNS void AS $$
BEGIN
    UPDATE members 
    SET grade = grade + 1,
        updated_at = NOW()
    WHERE occupation = 'student' 
    AND grade IS NOT NULL 
    AND grade < 13 
    AND is_deleted = FALSE;
END;
$$ language 'plpgsql';

-- Insert sample data for testing
INSERT INTO roads (name) VALUES 
('Main Road'),
('Temple Road'),
('School Lane'),
('Market Street')
ON CONFLICT (name) DO NOTHING;

INSERT INTO sub_roads (name, road_id) 
SELECT 'Sub Road A', id FROM roads WHERE name = 'Main Road'
UNION ALL
SELECT 'Sub Road B', id FROM roads WHERE name = 'Main Road'
UNION ALL
SELECT 'Temple Path', id FROM roads WHERE name = 'Temple Road'
ON CONFLICT (name, road_id) DO NOTHING;

INSERT INTO addresses (address, road_id, sub_road_id)
SELECT 
    '123 Sample Address',
    r.id,
    sr.id
FROM roads r
JOIN sub_roads sr ON sr.road_id = r.id
WHERE r.name = 'Main Road' AND sr.name = 'Sub Road A'
ON CONFLICT (address, road_id, sub_road_id) DO NOTHING;

-- User Activity Logs Table
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

-- Row Level Security for activity logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow system to insert activity logs (for server-side logging)
CREATE POLICY "Allow system to insert activity logs" 
ON user_activity_logs FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy: Allow service role to insert activity logs
CREATE POLICY "Allow service role to insert activity logs" 
ON user_activity_logs FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Policy: Allow service role to select all activity logs (for API queries)
CREATE POLICY "Allow service role to select all activity logs" 
ON user_activity_logs FOR SELECT 
TO service_role 
USING (true);

-- Policy: Allow authenticated users to view activity logs
CREATE POLICY "Allow authenticated users to view activity logs" 
ON user_activity_logs FOR SELECT 
TO authenticated 
USING (true);