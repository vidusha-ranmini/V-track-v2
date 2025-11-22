-- Safe Database Setup - Handles Existing Tables and Policies
-- Run this in your Supabase SQL Editor

-- First, let's check what we have and fix the RLS policies for your custom auth system

-- Drop existing problematic policies and recreate them
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users full access to roads" ON roads;
    DROP POLICY IF EXISTS "Allow authenticated users full access to sub_roads" ON sub_roads;
    DROP POLICY IF EXISTS "Allow authenticated users full access to sub_sub_roads" ON sub_sub_roads;
    DROP POLICY IF EXISTS "Allow authenticated users full access to addresses" ON addresses;
    DROP POLICY IF EXISTS "Allow authenticated users full access to households" ON households;
    DROP POLICY IF EXISTS "Allow authenticated users full access to members" ON members;
    DROP POLICY IF EXISTS "Allow authenticated users full access to businesses" ON businesses;
    DROP POLICY IF EXISTS "Allow authenticated users full access to road_lamps" ON road_lamps;
    DROP POLICY IF EXISTS "Allow authenticated users full access to deletion_log" ON deletion_log;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies may not exist, continuing...';
END $$;

-- Create tables if they don't exist (safe to run multiple times)
CREATE TABLE IF NOT EXISTS roads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sub_roads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(name, road_id)
);

CREATE TABLE IF NOT EXISTS sub_sub_roads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    parent_sub_road_id UUID REFERENCES sub_roads(id) ON DELETE CASCADE,
    development_status TEXT CHECK (development_status IN ('developed', 'undeveloped')) DEFAULT 'undeveloped',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(name, parent_sub_road_id)
);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    road_id UUID REFERENCES roads(id) ON DELETE CASCADE,
    sub_road_id UUID REFERENCES sub_roads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(address, road_id, sub_road_id)
);

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

CREATE TABLE IF NOT EXISTS deletion_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    admin_user TEXT NOT NULL
);

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

-- Create PERMISSIVE policies that work with your custom auth system
-- These allow all operations since you handle auth in your Next.js application

CREATE POLICY "Allow all operations on roads" ON roads FOR ALL USING (true);
CREATE POLICY "Allow all operations on sub_roads" ON sub_roads FOR ALL USING (true);
CREATE POLICY "Allow all operations on sub_sub_roads" ON sub_sub_roads FOR ALL USING (true);
CREATE POLICY "Allow all operations on addresses" ON addresses FOR ALL USING (true);
CREATE POLICY "Allow all operations on households" ON households FOR ALL USING (true);
CREATE POLICY "Allow all operations on members" ON members FOR ALL USING (true);
CREATE POLICY "Allow all operations on businesses" ON businesses FOR ALL USING (true);
CREATE POLICY "Allow all operations on road_lamps" ON road_lamps FOR ALL USING (true);
CREATE POLICY "Allow all operations on deletion_log" ON deletion_log FOR ALL USING (true);

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_sub_roads_road_id ON sub_roads(road_id);
CREATE INDEX IF NOT EXISTS idx_addresses_road_sub_road ON addresses(road_id, sub_road_id);
CREATE INDEX IF NOT EXISTS idx_households_address_id ON households(address_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_nic ON members(nic);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(road_id, sub_road_id, address_id);
CREATE INDEX IF NOT EXISTS idx_road_lamps_location ON road_lamps(road_id, sub_road_id, address_id);

-- Create function for auto-updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
DROP TRIGGER IF EXISTS update_road_lamps_updated_at ON road_lamps;

-- Create triggers for updated_at
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_road_lamps_updated_at BEFORE UPDATE ON road_lamps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for annual grade increment
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

-- Insert sample data (safe - uses ON CONFLICT)
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

-- Display success message
SELECT 'Database setup completed successfully! Tables created, policies updated, and sample data inserted.' as result;