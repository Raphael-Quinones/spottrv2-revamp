-- Migration: Enable free tier with 1,000 monthly credits
-- Purpose: Give free users 1,000 credits per month to try the platform
-- Date: 2025-09-18
-- Cost: ~$0.10 per free user per month

-- Update the allocate_monthly_credits function to support free tier
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
      v_credits := 100000; -- 100,000 credits for enterprise (can be customized)
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

-- Function to auto-allocate credits at the start of each month
-- This can be called by a cron job or trigger
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

-- Update get_credit_balance to handle new users with no record
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
  v_month DATE;
  v_tier subscription_tier;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Get user's tier
  SELECT subscription_tier INTO v_tier
  FROM users WHERE id = p_user_id;

  -- Get balance for current month
  SELECT credits_balance INTO v_balance
  FROM usage_tracking
  WHERE user_id = p_user_id AND month = v_month;

  -- If no record exists and user is new this month, return 0
  -- They need to call allocate_monthly_credits to get their credits
  IF v_balance IS NULL THEN
    RETURN 0;
  END IF;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION allocate_monthly_credits IS 'Allocates monthly credits based on subscription tier: free=1000, pro=40000, enterprise=100000';
COMMENT ON FUNCTION allocate_monthly_credits_for_all_users IS 'Batch function to allocate monthly credits for all active users - can be called by scheduler';

-- Allocate credits for any existing free tier users who don't have credits yet
DO $$
DECLARE
  v_result JSONB;
BEGIN
  -- Try to allocate for all users (will skip those who already have allocation)
  v_result := allocate_monthly_credits_for_all_users();
  RAISE NOTICE 'Initial allocation result: %', v_result;
END $$;