-- Migration: Add usage tracking for monthly limits
-- Purpose: Track video processing usage per user per month for subscription limits
-- Date: 2025-09-16

-- Create usage tracking table
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    minutes_used FLOAT DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, month)
);

-- Add index for faster queries
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month);
CREATE INDEX idx_usage_tracking_month ON usage_tracking(month);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role has full access for backend operations
CREATE POLICY "Service role can manage all usage" ON usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Apply updated_at trigger
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create usage record for current month
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
        RETURNING id INTO v_record_id;
    END IF;

    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_minutes FLOAT,
    p_video_count INTEGER DEFAULT 1
)
RETURNS usage_tracking AS $$
DECLARE
    v_record usage_tracking;
    v_current_month DATE;
BEGIN
    -- Get first day of current month
    v_current_month := DATE_TRUNC('month', CURRENT_DATE);

    -- Insert or update usage record
    INSERT INTO usage_tracking (user_id, month, minutes_used, video_count)
    VALUES (p_user_id, v_current_month, p_minutes, p_video_count)
    ON CONFLICT (user_id, month)
    DO UPDATE SET
        minutes_used = usage_tracking.minutes_used + EXCLUDED.minutes_used,
        video_count = usage_tracking.video_count + EXCLUDED.video_count,
        updated_at = TIMEZONE('utc', NOW())
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded monthly limit
CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id UUID)
RETURNS TABLE(
    is_exceeded BOOLEAN,
    minutes_used FLOAT,
    minutes_limit INTEGER,
    percentage_used FLOAT
) AS $$
DECLARE
    v_subscription_tier subscription_tier;
    v_minutes_used FLOAT;
    v_limit INTEGER;
    v_current_month DATE;
BEGIN
    -- Get first day of current month
    v_current_month := DATE_TRUNC('month', CURRENT_DATE);

    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = p_user_id;

    -- Set limits based on tier
    CASE v_subscription_tier
        WHEN 'free' THEN v_limit := 10;
        WHEN 'pro' THEN v_limit := 100;
        WHEN 'enterprise' THEN v_limit := 999999; -- Effectively unlimited
        ELSE v_limit := 10; -- Default to free tier
    END CASE;

    -- Get current usage
    SELECT COALESCE(ut.minutes_used, 0) INTO v_minutes_used
    FROM usage_tracking ut
    WHERE ut.user_id = p_user_id AND ut.month = v_current_month;

    -- Return result
    RETURN QUERY
    SELECT
        v_minutes_used >= v_limit AS is_exceeded,
        COALESCE(v_minutes_used, 0) AS minutes_used,
        v_limit AS minutes_limit,
        CASE
            WHEN v_limit > 0 THEN (COALESCE(v_minutes_used, 0) / v_limit * 100)
            ELSE 0
        END AS percentage_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE usage_tracking IS 'Tracks monthly video processing usage for enforcing subscription limits';
COMMENT ON FUNCTION get_or_create_usage_record IS 'Gets or creates a usage tracking record for the current month';
COMMENT ON FUNCTION increment_usage IS 'Increments usage counters when a video is processed';
COMMENT ON FUNCTION check_usage_limit IS 'Checks if user has exceeded their monthly processing limit';