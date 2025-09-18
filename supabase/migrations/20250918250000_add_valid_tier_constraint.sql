-- Migration: Add Valid Tier Constraint
-- Purpose: Prevent use of phantom tiers (starter, business)
-- Date: 2025-09-18
--
-- The enum type subscription_tier has phantom values 'starter' and 'business'
-- that were added in previous migrations but are not used in the application.
-- We can't remove enum values in PostgreSQL, but we can prevent their use.

-- =====================================
-- ADD CONSTRAINT TO PREVENT PHANTOM TIERS
-- =====================================
-- This constraint ensures only valid tiers are used
ALTER TABLE users
DROP CONSTRAINT IF EXISTS valid_subscription_tier;

ALTER TABLE users
ADD CONSTRAINT valid_subscription_tier
CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT valid_subscription_tier ON users IS
'Ensures only valid subscription tiers (free, pro, enterprise) are used. Prevents use of phantom tiers (starter, business) that exist in enum but are not supported.';

-- =====================================
-- VERIFY NO PHANTOM TIERS IN USE
-- =====================================
-- Check if any users have phantom tiers (should be none)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM users
  WHERE subscription_tier NOT IN ('free', 'pro', 'enterprise');

  IF v_count > 0 THEN
    RAISE WARNING 'Found % users with invalid subscription tiers', v_count;
    -- Update them to free tier as a safe default
    UPDATE users
    SET subscription_tier = 'free'
    WHERE subscription_tier NOT IN ('free', 'pro', 'enterprise');
    RAISE NOTICE 'Updated invalid tiers to free tier';
  END IF;
END $$;