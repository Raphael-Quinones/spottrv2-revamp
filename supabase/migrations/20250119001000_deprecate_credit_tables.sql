-- Migration to Autumn: Clean up credit-related functions
-- Since credit tables weren't created yet, we just need to clean up any functions and prepare for Autumn

-- Drop credit-related functions if they exist
DROP FUNCTION IF EXISTS calculate_credits(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS deduct_credits(UUID, INTEGER, INTEGER, INTEGER, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS add_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_credit_balance(UUID);
DROP FUNCTION IF EXISTS get_or_create_usage_tracking(UUID, DATE);
DROP FUNCTION IF EXISTS update_usage_tracking();

-- Add a migration_note column to users table to track the migration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS autumn_migration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS autumn_migration_note TEXT DEFAULT 'Using Autumn for credit and billing management';

-- Update all users to indicate they're using Autumn
UPDATE users
SET autumn_migration_date = NOW(),
    autumn_migration_note = 'Using Autumn for credit and billing management'
WHERE autumn_migration_date IS NULL;