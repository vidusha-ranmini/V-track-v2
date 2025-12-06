-- Add separate columns for drug use and thief monitoring to members table
-- These fields are used to discreetly track members who require enhanced community monitoring
-- Drug users will be indicated with an orange dot, thieves with a black dot

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS is_drug_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_thief BOOLEAN DEFAULT FALSE;

-- Add comments to the columns for documentation
COMMENT ON COLUMN members.is_drug_user IS 'Discreet flag for members involved in drug use (shown with orange dot)';
COMMENT ON COLUMN members.is_thief IS 'Discreet flag for members involved in theft (shown with black dot)';

-- Keep the old column for backward compatibility if it exists
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS requires_special_monitoring BOOLEAN DEFAULT FALSE;
