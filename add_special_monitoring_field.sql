-- Add requires_special_monitoring field to members table
-- This field is for discretely marking individuals who require special community monitoring

ALTER TABLE members ADD COLUMN IF NOT EXISTS requires_special_monitoring BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_members_special_monitoring ON members(requires_special_monitoring) WHERE requires_special_monitoring = TRUE;

-- Add comment to explain the field purpose (for internal use only)
COMMENT ON COLUMN members.requires_special_monitoring IS 'Internal field for enhanced community safety monitoring protocols';

-- Update existing records to have default value
UPDATE members SET requires_special_monitoring = FALSE WHERE requires_special_monitoring IS NULL;