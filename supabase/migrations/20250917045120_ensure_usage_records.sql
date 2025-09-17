-- Ensure all existing users have usage tracking records for the current month
DO $$
DECLARE
    user_record RECORD;
    current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    -- For each user without a usage record for current month
    FOR user_record IN
        SELECT u.id
        FROM users u
        LEFT JOIN usage_tracking ut ON u.id = ut.user_id
            AND ut.month = current_month
        WHERE ut.id IS NULL
    LOOP
        -- Create usage record with defaults
        INSERT INTO usage_tracking (user_id, month, minutes_used, video_count)
        VALUES (user_record.id, current_month, 0, 0)
        ON CONFLICT (user_id, month) DO NOTHING;

        RAISE NOTICE 'Created usage record for user %', user_record.id;
    END LOOP;
END $$;

-- Update the check_usage_limit function to handle missing records better
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
    v_minutes_used FLOAT;
    v_minutes_limit FLOAT;
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
        WHEN 'pro' THEN v_minutes_limit := 100;
        WHEN 'enterprise' THEN v_minutes_limit := 999999; -- effectively unlimited
        ELSE v_minutes_limit := 10; -- free tier
    END CASE;

    -- Get current usage (default to 0 if no record)
    SELECT COALESCE(minutes_used, 0) INTO v_minutes_used
    FROM usage_tracking
    WHERE user_id = p_user_id AND month = v_current_month;

    -- If no usage record found, default to 0
    IF v_minutes_used IS NULL THEN
        v_minutes_used := 0;
    END IF;

    -- Return results
    RETURN QUERY
    SELECT
        v_minutes_used >= v_minutes_limit AS is_exceeded,
        v_minutes_used AS minutes_used,
        v_minutes_limit AS minutes_limit,
        CASE
            WHEN v_minutes_limit > 0 THEN (v_minutes_used / v_minutes_limit * 100)
            ELSE 0
        END AS percentage_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_or_create_usage_record to be more robust
DROP FUNCTION IF EXISTS get_or_create_usage_record(UUID);

CREATE OR REPLACE FUNCTION get_or_create_usage_record(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_record_id UUID;
    v_current_month DATE;
BEGIN
    -- Get first day of current month
    v_current_month := DATE_TRUNC('month', CURRENT_DATE);

    -- Try to get existing record
    SELECT id INTO v_record_id
    FROM usage_tracking
    WHERE user_id = p_user_id AND month = v_current_month;

    -- If no record exists, create one
    IF v_record_id IS NULL THEN
        INSERT INTO usage_tracking (user_id, month, minutes_used, video_count)
        VALUES (p_user_id, v_current_month, 0, 0)
        ON CONFLICT (user_id, month) DO UPDATE
        SET id = usage_tracking.id  -- Do nothing, just return the existing id
        RETURNING id INTO v_record_id;
    END IF;

    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;