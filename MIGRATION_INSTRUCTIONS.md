# Database Migration Instructions

## Run the Special Monitoring Field Migration

To add the `requires_special_monitoring` field to your database:

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the content from `add_special_monitoring_field.sql`
4. Click "RUN" to execute the migration

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
Connect to your PostgreSQL database and run:

```sql
-- Add the new column
ALTER TABLE members ADD COLUMN IF NOT EXISTS requires_special_monitoring BOOLEAN DEFAULT FALSE;

-- Add performance index
CREATE INDEX IF NOT EXISTS idx_members_special_monitoring ON members(requires_special_monitoring) WHERE requires_special_monitoring = TRUE;

-- Add documentation comment
COMMENT ON COLUMN members.requires_special_monitoring IS 'Internal field for enhanced community safety monitoring protocols';

-- Set default for existing records
UPDATE members SET requires_special_monitoring = FALSE WHERE requires_special_monitoring IS NULL;
```

## Verification

After running the migration, you can verify it worked by:

1. Check that the column exists:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'members' AND column_name = 'requires_special_monitoring';
```

2. Test the feature:
   - Add a new member with the special monitoring checkbox checked
   - Verify the orange dot appears next to the member's name in the table
   - Check that the blue notice appears in the member details modal

## Rollback (if needed)

If you need to remove this field:
```sql
-- Remove the column (this will delete all data in this column!)
ALTER TABLE members DROP COLUMN IF EXISTS requires_special_monitoring;

-- Remove the index
DROP INDEX IF EXISTS idx_members_special_monitoring;
```

**Note**: Only run the rollback if absolutely necessary, as it will permanently delete all special monitoring data.