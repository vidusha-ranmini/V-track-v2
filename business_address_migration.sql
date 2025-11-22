-- Migration: Add business_address field and remove address_id dependency
-- This allows businesses to have their own address without referencing the addresses table

-- Add the new business_address column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Copy existing address data from the addresses table before removing the foreign key
UPDATE businesses 
SET business_address = addresses.address 
FROM addresses 
WHERE businesses.address_id = addresses.id 
AND businesses.business_address IS NULL;

-- Drop the foreign key constraint and the address_id column
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_address_id_fkey;
ALTER TABLE businesses DROP COLUMN IF EXISTS address_id;

-- Update the index to exclude address_id
DROP INDEX IF EXISTS idx_businesses_location;
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(road_id, sub_road_id);
CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(business_name) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(business_owner) WHERE is_deleted = false;

-- Add a check constraint to ensure business_address is not empty when provided
ALTER TABLE businesses ADD CONSTRAINT check_business_address_not_empty 
CHECK (business_address IS NULL OR LENGTH(TRIM(business_address)) > 0);

-- Add comment to explain the change
COMMENT ON COLUMN businesses.business_address IS 'Business address stored as free text, independent of the addresses table';