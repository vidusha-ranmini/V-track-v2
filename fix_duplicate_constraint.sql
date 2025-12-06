-- Fix for duplicate key constraint issue
-- This script allows multiple sub-sub-roads with same name but different dimensions

-- Drop the existing unique constraint that prevents same names
ALTER TABLE sub_sub_roads 
DROP CONSTRAINT IF EXISTS sub_sub_roads_name_parent_sub_road_id_key;

-- Create a new composite unique constraint that includes dimensions
-- This allows same road names as long as width OR height is different
ALTER TABLE sub_sub_roads 
ADD CONSTRAINT sub_sub_roads_name_dimensions_unique 
UNIQUE (name, parent_sub_road_id, width, height);

-- Alternative: If you want complete flexibility without any name constraints,
-- uncomment the following lines and comment out the constraint above:
-- 
-- -- Remove unique constraint entirely to allow complete flexibility
-- ALTER TABLE sub_sub_roads 
-- DROP CONSTRAINT IF EXISTS sub_sub_roads_name_parent_sub_road_id_key;

-- Add helpful comment explaining the change
COMMENT ON CONSTRAINT sub_sub_roads_name_dimensions_unique ON sub_sub_roads IS 
'Allows multiple roads with same name under same parent as long as dimensions (width/height) are different';

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Fixed unique constraint issue. You can now add roads with same name but different dimensions.';
END $$;