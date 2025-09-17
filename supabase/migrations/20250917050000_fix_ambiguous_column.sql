-- Fix ambiguous column reference in check_usage_limit function
DROP FUNCTION IF EXISTS check_usage_limit(UUID);

CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id UUID)
RETURNS TABLE(
    is_exceeded BOOLEAN,
    minutes_used FLOAT,
    minutes_limit FLOAT,
    percentage_used FLOAT
) AS $$
DECLARE
    v_subscription_tier subscription_tier;
    v_used_minutes FLOAT;  -- Renamed to avoid ambiguity
    v_limit_minutes FLOAT;  -- Renamed to avoid ambiguity
    v_current_month DATE;
BEGIN
    -- Get first day of current month
    v_current_month := DATE_TRUNC('month', CURRENT_DATE);

    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = p_user_id;

    -- Set default to free if not found
    IF v_subscription_tier IS NULL THEN
        v_subscription_tier := 'free';
    END IF;

    -- Determine minutes limit based on tier
    CASE v_subscription_tier
        WHEN 'pro' THEN v_limit_minutes := 100;
        WHEN 'enterprise' THEN v_limit_minutes := 999999; -- effectively unlimited
        ELSE v_limit_minutes := 10; -- free tier
    END CASE;

    -- Get current usage (default to 0 if no record)
    SELECT COALESCE(ut.minutes_used, 0) INTO v_used_minutes
    FROM usage_tracking ut
    WHERE ut.user_id = p_user_id AND ut.month = v_current_month;

    -- If no usage record found, default to 0
    IF v_used_minutes IS NULL THEN
        v_used_minutes := 0;
    END IF;

    -- Return results
    RETURN QUERY
    SELECT
        v_used_minutes >= v_limit_minutes AS is_exceeded,
        v_used_minutes AS minutes_used,
        v_limit_minutes AS minutes_limit,
        CASE
            WHEN v_limit_minutes > 0 THEN (v_used_minutes / v_limit_minutes * 100)
            ELSE 0
        END AS percentage_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;