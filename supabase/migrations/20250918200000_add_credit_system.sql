-- Migration: Implement credit-based billing system with 10x markup
-- Purpose: Replace minutes-based billing with precise token-based credit system
-- Formula: Customer pays 10x our GPT-5 nano costs
-- Date: 2025-09-18

-- Add credit tracking columns to usage_tracking
ALTER TABLE usage_tracking
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_input_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_output_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0;

-- Create credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credits_amount INTEGER NOT NULL, -- Negative for deductions, positive for additions
  transaction_type VARCHAR(20) NOT NULL, -- 'purchase', 'process', 'search', 'refund', 'monthly_allocation'
  description TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  balance_after INTEGER NOT NULL,
  related_video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create search logs table to track search token usage
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  credits_used INTEGER NOT NULL,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_video_id ON search_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for search_logs
CREATE POLICY "Users can view own search logs" ON search_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage search logs" ON search_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get tier credits allocation
CREATE OR REPLACE FUNCTION get_tier_credits(p_tier subscription_tier)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'free' THEN RETURN 1000;      -- 1,000 credits ($1 value)
    WHEN 'starter' THEN RETURN 12000;  -- 12,000 credits ($12 value)
    WHEN 'pro' THEN RETURN 40000;      -- 40,000 credits ($40 value)
    WHEN 'business' THEN RETURN 120000; -- 120,000 credits ($120 value)
    WHEN 'enterprise' THEN RETURN 600000; -- 600,000 credits ($600 value)
    ELSE RETURN 1000; -- Default to free tier
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate credits from tokens (10x markup)
-- GPT-5 nano: Input $0.05/1M tokens, Output $0.40/1M tokens
-- With 10x markup: Input $0.0005/1k tokens, Output $0.004/1k tokens
-- 1 credit = $0.001
CREATE OR REPLACE FUNCTION calculate_credits(
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_input_cost DECIMAL;
  v_output_cost DECIMAL;
  v_total_cost DECIMAL;
BEGIN
  -- Calculate cost with 10x markup
  v_input_cost := (p_input_tokens::DECIMAL / 1000) * 0.0005;  -- $0.0005 per 1k input tokens
  v_output_cost := (p_output_tokens::DECIMAL / 1000) * 0.004; -- $0.004 per 1k output tokens
  v_total_cost := v_input_cost + v_output_cost;

  -- Convert to credits (1 credit = $0.001), round up
  RETURN CEIL(v_total_cost / 0.001);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to deduct credits with balance check
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_operation TEXT,
  p_video_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_new_balance INTEGER;
  v_month DATE;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Get or create usage record for current month
  INSERT INTO usage_tracking (user_id, month, credits_balance)
  VALUES (p_user_id, v_month, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  -- Get current balance
  SELECT credits_balance INTO v_balance
  FROM usage_tracking
  WHERE user_id = p_user_id AND month = v_month
  FOR UPDATE;

  -- Check sufficient balance
  IF v_balance < p_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_balance,
      'required', p_credits
    );
  END IF;

  -- Deduct credits and update token counts
  UPDATE usage_tracking SET
    credits_balance = credits_balance - p_credits,
    total_input_tokens = total_input_tokens + p_input_tokens,
    total_output_tokens = total_output_tokens + p_output_tokens,
    updated_at = TIMEZONE('utc', NOW())
  WHERE user_id = p_user_id AND month = v_month
  RETURNING credits_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    credits_amount,
    transaction_type,
    description,
    input_tokens,
    output_tokens,
    balance_after,
    related_video_id
  ) VALUES (
    p_user_id,
    -p_credits,
    p_operation,
    p_description,
    p_input_tokens,
    p_output_tokens,
    v_new_balance,
    p_video_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_used', p_credits,
    'balance', v_new_balance,
    'input_tokens', p_input_tokens,
    'output_tokens', p_output_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases or monthly allocations)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
  v_month DATE;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Get or create usage record for current month
  INSERT INTO usage_tracking (user_id, month, credits_balance)
  VALUES (p_user_id, v_month, p_credits)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    credits_balance = usage_tracking.credits_balance + p_credits,
    credits_purchased = usage_tracking.credits_purchased + p_credits,
    updated_at = TIMEZONE('utc', NOW())
  RETURNING credits_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    credits_amount,
    transaction_type,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    p_credits,
    p_transaction_type,
    p_description,
    v_new_balance
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to allocate monthly credits based on subscription tier
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

  -- Get credits for tier
  v_credits := get_tier_credits(v_tier);

  -- Add credits
  RETURN add_credits(
    p_user_id,
    v_credits,
    'monthly_allocation',
    'Monthly credit allocation for ' || v_tier::TEXT || ' tier'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
  v_month DATE;
BEGIN
  v_month := DATE_TRUNC('month', CURRENT_DATE);

  SELECT credits_balance INTO v_balance
  FROM usage_tracking
  WHERE user_id = p_user_id AND month = v_month;

  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for credit usage analytics
CREATE OR REPLACE VIEW credit_usage_summary AS
SELECT
  u.id as user_id,
  u.email,
  u.subscription_tier,
  ut.month,
  ut.credits_balance,
  ut.total_input_tokens,
  ut.total_output_tokens,
  ut.credits_purchased,
  calculate_credits(ut.total_input_tokens::INTEGER, ut.total_output_tokens::INTEGER) as credits_used,
  get_tier_credits(u.subscription_tier) as tier_credits
FROM users u
LEFT JOIN usage_tracking ut ON u.id = ut.user_id
WHERE ut.month = DATE_TRUNC('month', CURRENT_DATE);

-- Migrate existing usage data to credits
-- Convert minutes to credits (rough estimate: 1 minute = 10 credits)
UPDATE usage_tracking
SET credits_balance = GREATEST(0, (100 - COALESCE(minutes_used, 0) * 10)::INTEGER),
    credits_purchased = CASE
      WHEN EXISTS (SELECT 1 FROM users WHERE id = usage_tracking.user_id AND subscription_tier = 'free') THEN 1000
      WHEN EXISTS (SELECT 1 FROM users WHERE id = usage_tracking.user_id AND subscription_tier = 'starter') THEN 12000
      WHEN EXISTS (SELECT 1 FROM users WHERE id = usage_tracking.user_id AND subscription_tier = 'pro') THEN 40000
      WHEN EXISTS (SELECT 1 FROM users WHERE id = usage_tracking.user_id AND subscription_tier = 'business') THEN 120000
      WHEN EXISTS (SELECT 1 FROM users WHERE id = usage_tracking.user_id AND subscription_tier = 'enterprise') THEN 600000
      ELSE 1000
    END
WHERE credits_balance IS NULL OR credits_balance = 0;

-- Add comments for documentation
COMMENT ON TABLE credit_transactions IS 'Audit trail of all credit transactions (purchases, usage, refunds)';
COMMENT ON TABLE search_logs IS 'Tracks token usage and credits consumed for search operations';
COMMENT ON FUNCTION calculate_credits IS 'Calculates credits from token usage with 10x markup on GPT-5 nano costs';
COMMENT ON FUNCTION deduct_credits IS 'Deducts credits from user balance with validation and logging';
COMMENT ON FUNCTION add_credits IS 'Adds credits to user balance (for purchases or allocations)';
COMMENT ON FUNCTION allocate_monthly_credits IS 'Allocates monthly credits based on subscription tier';
COMMENT ON FUNCTION get_credit_balance IS 'Gets current credit balance for a user';