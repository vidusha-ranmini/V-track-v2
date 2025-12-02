-- New Road Development Schema for V-track-v2
-- This schema aligns with the API routes and React UI component

-- Drop all existing objects that might depend on old columns
DROP VIEW IF EXISTS road_development_summary CASCADE;
DROP TRIGGER IF EXISTS calculate_road_area_cost_trigger ON sub_sub_roads;
DROP TRIGGER IF EXISTS calculate_road_cost_trigger ON sub_sub_roads;
DROP FUNCTION IF EXISTS calculate_road_development_area_cost() CASCADE;
DROP FUNCTION IF EXISTS calculate_road_development_cost() CASCADE;
DROP FUNCTION IF EXISTS get_road_development_stats() CASCADE;

-- Clean up old development-related columns and constraints
ALTER TABLE sub_sub_roads 
DROP CONSTRAINT IF EXISTS sub_sub_roads_development_status_check;
 


   
   
-- Drop columns with CASCADE to remove all dependencies 
ALTER TABLE sub_sub_roads 
DROP COLUMN IF EXISTS development_parts CASCADE,
DROP COLUMN IF EXISTS estimated_area CASCADE;

-- Add development-related columns with proper defaults
ALTER TABLE sub_sub_roads 
ADD COLUMN IF NOT EXISTS width DECIMAL(8,2) DEFAULT 25.0,
ADD COLUMN IF NOT EXISTS height DECIMAL(8,2) DEFAULT 10.0, 
ADD COLUMN IF NOT EXISTS square_feet DECIMAL(10,2) DEFAULT 250.0,
ADD COLUMN IF NOT EXISTS cost_per_sq_ft DECIMAL(10,2) DEFAULT 400.00,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2) DEFAULT 100000.00,
ADD COLUMN IF NOT EXISTS development_status VARCHAR(20) DEFAULT 'undeveloped';

-- Add constraint for development status
ALTER TABLE sub_sub_roads 
ADD CONSTRAINT sub_sub_roads_development_status_check 
CHECK (development_status IN ('developed', 'undeveloped', 'in_progress'));

-- Function to auto-calculate square feet and total cost
CREATE OR REPLACE FUNCTION calculate_road_development_area_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate square feet (width × height)
    NEW.square_feet = NEW.width * NEW.height;
    
    -- Calculate total cost (square_feet × cost_per_sq_ft)
    NEW.total_cost = NEW.square_feet * NEW.cost_per_sq_ft;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate on INSERT/UPDATE
CREATE TRIGGER calculate_road_area_cost_trigger
    BEFORE INSERT OR UPDATE OF width, height, cost_per_sq_ft ON sub_sub_roads
    FOR EACH ROW
    EXECUTE FUNCTION calculate_road_development_area_cost();

-- Clear existing development data and reset to defaults
UPDATE sub_sub_roads SET 
    width = 25.0,
    height = 10.0,
    square_feet = 250.0,
    cost_per_sq_ft = 400.00,
    total_cost = 100000.00,
    development_status = 'undeveloped'
WHERE is_deleted = false;

-- Delete all existing development data to start fresh
DELETE FROM sub_sub_roads WHERE is_deleted = false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_development_status ON sub_sub_roads(development_status);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_total_cost ON sub_sub_roads(total_cost DESC);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_road_parent ON sub_sub_roads(road_id, parent_sub_road_id);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_dimensions ON sub_sub_roads(width, height);

-- Create a view that matches the API response structure
CREATE OR REPLACE VIEW road_development_summary AS
SELECT 
    ssr.id,
    r.name as road_name,
    sr.name as sub_road_name,
    ssr.name as sub_sub_road_name,
    ssr.width,
    ssr.height,
    ssr.square_feet,
    ssr.cost_per_sq_ft,
    ssr.total_cost,
    ssr.development_status,
    CASE 
        WHEN ssr.parent_sub_road_id IS NULL THEN 'main'
        ELSE 'sub'
    END as road_type,
    ssr.created_at,
    ssr.updated_at
FROM sub_sub_roads ssr
INNER JOIN roads r ON ssr.road_id = r.id
LEFT JOIN sub_roads sr ON ssr.parent_sub_road_id = sr.id
WHERE ssr.is_deleted = false
ORDER BY r.name, sr.name NULLS FIRST, ssr.name;

-- Grant access to the view
GRANT SELECT ON road_development_summary TO public, authenticated, service_role;

-- Function to get development statistics (matches API expectations)
CREATE OR REPLACE FUNCTION get_road_development_stats()
RETURNS TABLE (
    total_projects INTEGER,
    developed_projects INTEGER,
    undeveloped_projects INTEGER,
    in_progress_projects INTEGER,
    total_estimated_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_projects,
        COUNT(*) FILTER (WHERE development_status = 'developed')::INTEGER as developed_projects,
        COUNT(*) FILTER (WHERE development_status = 'undeveloped')::INTEGER as undeveloped_projects,
        COUNT(*) FILTER (WHERE development_status = 'in_progress')::INTEGER as in_progress_projects,
        COALESCE(SUM(total_cost), 0)::DECIMAL as total_estimated_cost
    FROM sub_sub_roads
    WHERE is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_development_status ON sub_sub_roads(development_status);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_total_cost ON sub_sub_roads(total_cost DESC);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_road_parent ON sub_sub_roads(road_id, parent_sub_road_id);
CREATE INDEX IF NOT EXISTS idx_sub_sub_roads_dimensions ON sub_sub_roads(width, height);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON sub_sub_roads TO authenticated, service_role;

-- Comments for documentation
COMMENT ON VIEW road_development_summary IS 'View for road development data with proper joins to existing roads/sub_roads';
COMMENT ON FUNCTION get_road_development_stats() IS 'Returns aggregated statistics for road development projects';
COMMENT ON FUNCTION calculate_road_development_area_cost() IS 'Auto-calculates square_feet and total_cost based on width, height, and cost_per_sq_ft';

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Road development schema updated successfully. Ready to use with existing roads and sub_roads tables.';
END $$;

-- Update API query to use the new view for better performance
COMMENT ON VIEW road_development_summary IS 'Comprehensive view for road development data with proper joins';
COMMENT ON FUNCTION get_road_development_stats() IS 'Returns aggregated statistics for road development projects';
COMMENT ON FUNCTION calculate_road_development_area_cost() IS 'Auto-calculates square_feet and total_cost based on width, height, and cost_per_sq_ft';