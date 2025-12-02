-- Update the road_development_summary view to include all necessary fields
-- This view will map the database fields to what the frontend expects

DROP VIEW IF EXISTS public.road_development_summary CASCADE;

CREATE OR REPLACE VIEW public.road_development_summary AS
SELECT 
  ssr.id,
  r.name as road_name,
  sr.name as sub_road_name,
  ssr.name as sub_sub_road_name,
  -- Use width and height directly (no development_parts)
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
  ssr.created_at
FROM sub_sub_roads ssr
INNER JOIN roads r ON ssr.road_id = r.id
LEFT JOIN sub_roads sr ON ssr.parent_sub_road_id = sr.id
WHERE ssr.is_deleted = false
ORDER BY r.name, sr.name NULLS FIRST, ssr.name;

-- Grant access to the view
GRANT SELECT ON public.road_development_summary TO public, authenticated, service_role;

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_road_development_stats() CASCADE;

-- Update the stats function to work with the correct fields
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

-- Update the trigger function to calculate values based on width and height
CREATE OR REPLACE FUNCTION calculate_road_development_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate square feet from width and height
    NEW.square_feet = COALESCE(NEW.width, 0) * COALESCE(NEW.height, 0);
    
    -- Calculate total cost
    NEW.total_cost = NEW.square_feet * COALESCE(NEW.cost_per_sq_ft, 400);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to work with the correct fields
DROP TRIGGER IF EXISTS calculate_road_cost_trigger ON sub_sub_roads;

CREATE TRIGGER calculate_road_cost_trigger
    BEFORE INSERT OR UPDATE OF width, height, cost_per_sq_ft ON sub_sub_roads
    FOR EACH ROW
    EXECUTE FUNCTION calculate_road_development_cost();

-- Add some helpful comments
COMMENT ON VIEW road_development_summary IS 'Comprehensive view for road development data with proper field mapping between database and frontend';
COMMENT ON FUNCTION get_road_development_stats() IS 'Returns aggregated statistics for road development projects';
COMMENT ON FUNCTION calculate_road_development_cost() IS 'Auto-calculates square_feet and total_cost based on width, height, and cost_per_sq_ft';

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Road development view and functions updated successfully. Database now properly supports width and height fields.';
END $$;