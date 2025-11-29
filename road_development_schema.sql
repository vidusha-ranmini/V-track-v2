-- Additional fields for road development tracking
-- Add these columns to the existing sub_sub_roads table

ALTER TABLE sub_sub_roads 
ADD COLUMN IF NOT EXISTS development_parts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_area INTEGER DEFAULT 0, -- in square feet
ADD COLUMN IF NOT EXISTS cost_per_sq_ft DECIMAL(10,2) DEFAULT 400.00,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2) DEFAULT 0.00;

-- Update development_status to include 'in_progress'
ALTER TABLE sub_sub_roads 
DROP CONSTRAINT IF EXISTS sub_sub_roads_development_status_check;

ALTER TABLE sub_sub_roads 
ADD CONSTRAINT sub_sub_roads_development_status_check 
CHECK (development_status IN ('developed', 'undeveloped', 'in_progress'));

-- Create function to automatically calculate total cost
CREATE OR REPLACE FUNCTION calculate_road_development_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate estimated area (development_parts * 250 sq ft per part)
    NEW.estimated_area = NEW.development_parts * 250;
    
    -- Calculate total cost
    NEW.total_cost = NEW.estimated_area * NEW.cost_per_sq_ft;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate costs
DROP TRIGGER IF EXISTS calculate_road_cost_trigger ON sub_sub_roads;
CREATE TRIGGER calculate_road_cost_trigger
    BEFORE INSERT OR UPDATE OF development_parts, cost_per_sq_ft ON sub_sub_roads
    FOR EACH ROW
    EXECUTE FUNCTION calculate_road_development_cost();

-- Insert sample road development data
DO $$
DECLARE
    main_road_id UUID;
    temple_road_id UUID;
    school_road_id UUID;
    market_road_id UUID;
    north_path_id UUID;
    south_path_id UUID;
    academic_wing_id UUID;
BEGIN
    -- Get road IDs
    SELECT id INTO main_road_id FROM roads WHERE name = 'Main Road' LIMIT 1;
    SELECT id INTO temple_road_id FROM roads WHERE name = 'Temple Road' LIMIT 1;
    SELECT id INTO school_road_id FROM roads WHERE name = 'School Lane' LIMIT 1;
    SELECT id INTO market_road_id FROM roads WHERE name = 'Market Street' LIMIT 1;
    
    -- Insert sub roads for roads that need them
    INSERT INTO sub_roads (name, road_id) VALUES
    ('North Path', temple_road_id),
    ('South Path', temple_road_id),
    ('Academic Wing', school_road_id)
    ON CONFLICT (name, road_id) DO NOTHING;
    
    -- Get sub road IDs
    SELECT id INTO north_path_id FROM sub_roads WHERE name = 'North Path' AND road_id = temple_road_id;
    SELECT id INTO south_path_id FROM sub_roads WHERE name = 'South Path' AND road_id = temple_road_id;
    SELECT id INTO academic_wing_id FROM sub_roads WHERE name = 'Academic Wing' AND road_id = school_road_id;
    
    -- Insert sub-sub roads with development data
    INSERT INTO sub_sub_roads (name, road_id, parent_sub_road_id, development_parts, cost_per_sq_ft, development_status) VALUES
    -- Pihena Maddegoda Main Road (no sub roads, direct sub-sub roads)
    ('1st Lane', main_road_id, NULL, 8, 400.00, 'developed'),
    ('2nd Lane', main_road_id, NULL, 10, 400.00, 'undeveloped'),
    ('3rd Lane', main_road_id, NULL, 6, 400.00, 'in_progress'),
    
    -- Temple Road sub-sub roads
    ('Temple Lane', temple_road_id, north_path_id, 12, 350.00, 'developed'),
    ('Prayer Hall Lane', temple_road_id, south_path_id, 15, 350.00, 'undeveloped'),
    
    -- School Lane sub-sub roads
    ('Playground Access', school_road_id, academic_wing_id, 8, 450.00, 'in_progress'),
    
    -- Market Street (no sub roads, direct sub-sub roads)
    ('Vendor Lane', market_road_id, NULL, 20, 500.00, 'undeveloped'),
    ('Loading Bay', market_road_id, NULL, 5, 500.00, 'developed')
    
    ON CONFLICT (name, parent_sub_road_id) DO NOTHING;
    
    -- For roads with NULL parent_sub_road_id, ensure uniqueness by road_id + name
    INSERT INTO sub_sub_roads (name, road_id, parent_sub_road_id, development_parts, cost_per_sq_ft, development_status) 
    SELECT '4th Lane', main_road_id, NULL, 12, 400.00, 'undeveloped'
    WHERE NOT EXISTS (
        SELECT 1 FROM sub_sub_roads 
        WHERE name = '4th Lane' AND road_id = main_road_id AND parent_sub_road_id IS NULL
    );
    
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_development_status ON sub_sub_roads(development_status);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_cost ON sub_sub_roads(total_cost DESC);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_road_parent ON sub_sub_roads(road_id, parent_sub_road_id);

-- Create view for easy road development reporting
CREATE OR REPLACE VIEW road_development_summary AS
SELECT 
    ssr.id,
    r.name as road_name,
    sr.name as sub_road_name,
    ssr.name as sub_sub_road_name,
    ssr.development_parts,
    ssr.estimated_area,
    ssr.cost_per_sq_ft,
    ssr.total_cost,
    ssr.development_status,
    CASE 
        WHEN ssr.parent_sub_road_id IS NULL THEN 'main'
        ELSE 'sub'
    END as road_type,
    ssr.created_at
FROM sub_sub_roads ssr
INNER JOIN roads r ON ssr.road_id = r.id
LEFT JOIN sub_roads sr ON ssr.parent_sub_road_id = sr.id
WHERE ssr.is_deleted = false
ORDER BY r.name, sr.name, ssr.name;

-- Grant access to the view
GRANT SELECT ON road_development_summary TO public, authenticated, service_role;

-- Function to get development statistics
CREATE OR REPLACE FUNCTION get_road_development_stats()
RETURNS TABLE (
    total_projects INTEGER,
    developed_projects INTEGER,
    undeveloped_projects INTEGER,
    in_progress_projects INTEGER,
    total_estimated_cost DECIMAL,
    total_developed_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_projects,
        COUNT(*) FILTER (WHERE development_status = 'developed')::INTEGER as developed_projects,
        COUNT(*) FILTER (WHERE development_status = 'undeveloped')::INTEGER as undeveloped_projects,
        COUNT(*) FILTER (WHERE development_status = 'in_progress')::INTEGER as in_progress_projects,
        COALESCE(SUM(total_cost), 0)::DECIMAL as total_estimated_cost,
        COALESCE(SUM(total_cost) FILTER (WHERE development_status = 'developed'), 0)::DECIMAL as total_developed_cost
    FROM sub_sub_roads
    WHERE is_deleted = false;
END;
$$ LANGUAGE plpgsql;