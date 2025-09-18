-- Migration: Enable Free Tier with Monthly Credit Allocation
-- Purpose: Update credit allocation to support free tier with 1,000 credits/month
-- Date: 2025-09-18
--
-- This updates the allocate_monthly_credits function to support all tiers:
-- Free: 1,000 credits (~1 hour video, cost: $0.10/month)
-- Pro: 40,000 credits (~40 hours video, cost: $4.00/month, charge: $29/month)
-- Enterprise: 100,000 credits (~100 hours video, customizable)

-- =====================================
-- UPDATE MONTHLY ALLOCATION FUNCTION
-- =====================================
CREATE OR REPLACE FUNCTION allocate_monthly_credits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier subscription_tier;
  v_credits INTEGER;
  v_month DATE;
  v_existing_allocation INTEGER;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Get user's tier
  SELECT subscription_tier INTO v_tier
  FROM users WHERE id = p_user_id;

  -- Determine credits based on tier
  CASE v_tier
    WHEN 'free' THEN
      v_credits := 1000;  -- 1,000 credits for free tier (~1 hour of video)
    WHEN 'pro' THEN
      v_credits := 40000; -- 40,000 credits for pro tier
    WHEN 'enterprise' THEN
      v_credits := 100000; -- 100,000 credits for enterprise (customizable)
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid subscription tier'
      );
  END CASE;

  -- Check if already allocated this month
  SELECT COUNT(*) INTO v_existing_allocation
  FROM credit_transactions
  WHERE user_id = p_user_id
  AND transaction_type = 'monthly_allocation'
  AND DATE_TRUNC('month', created_at) = v_month;

  IF v_existing_allocation > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credits already allocated for this month'
    );
  END IF;

  -- Add credits with appropriate description
  RETURN add_credits(
    p_user_id,
    v_credits,
    'monthly_allocation',
    FORMAT('Monthly credit allocation for %s subscription (%s credits)', v_tier, v_credits)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- BATCH ALLOCATION FUNCTION
-- =====================================
-- Function to allocate credits for all users (can be called by scheduler)
CREATE OR REPLACE FUNCTION allocate_monthly_credits_for_all_users()
RETURNS JSONB AS $$
DECLARE
  v_user RECORD;
  v_result JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
BEGIN
  -- Loop through all active users
  FOR v_user IN
    SELECT id, email, subscription_tier
    FROM users
    WHERE subscription_tier IS NOT NULL
  LOOP
    -- Try to allocate credits for each user
    v_result := allocate_monthly_credits(v_user.id);

    IF (v_result->>'success')::boolean THEN
      v_success_count := v_success_count + 1;
    ELSE
      -- Skip users who already have allocation (not an error)
      IF v_result->>'error' != 'Credits already allocated for this month' THEN
        v_error_count := v_error_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'users_allocated', v_success_count,
    'errors', v_error_count,
    'timestamp', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- ADD FUNCTION COMMENTS
-- =====================================
COMMENT ON FUNCTION allocate_monthly_credits IS 'Allocates monthly credits based on subscription tier: free=1000, pro=40000, enterprise=100000';
COMMENT ON FUNCTION allocate_monthly_credits_for_all_users IS 'Batch function to allocate monthly credits for all active users - can be called by scheduler';

-- =====================================
-- INITIAL ALLOCATION
-- =====================================
-- Allocate credits for any existing users who don't have credits yet
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Try to allocate for all users (will skip those who already have allocation)
  v_result := allocate_monthly_credits_for_all_users();
  RAISE NOTICE 'Initial allocation result: %', v_result;
END $$;