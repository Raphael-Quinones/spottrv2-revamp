-- Migration: Implement credit-based billing system
-- Purpose: Replace minute-based billing with token-based credits (10x markup)
-- Date: 2025-09-18

-- Note: We keep the existing subscription_tier enum but only use 'pro'
-- Users must have 'pro' tier to use the platform (no free tier)

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
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('monthly_allocation', 'purchase', 'process', 'search', 'refund')),
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

-- Function to calculate credits from tokens (10x markup)
-- GPT-5 nano base: Input $0.05/1M, Output $0.40/1M
-- With 10x markup: Input $0.0005/1k, Output $0.004/1k
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

  -- Get current balance (lock row for update)
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
  INSERT INTO usage_tracking (user_id, month, credits_balance, credits_purchased)
  VALUES (p_user_id, v_month, p_credits, p_credits)
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

-- Function to allocate monthly credits (40,000 for pro tier)
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

  -- Only 'pro' tier gets credits (no free tier)
  IF v_tier != 'pro' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must have pro subscription to receive credits'
    );
  END IF;

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

  -- Pro tier gets 40,000 credits
  v_credits := 40000;

  -- Add credits
  RETURN add_credits(
    p_user_id,
    v_credits,
    'monthly_allocation',
    'Monthly credit allocation for pro subscription'
  );
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
  ut.credits_purchased,
  ut.total_input_tokens,
  ut.total_output_tokens,
  calculate_credits(ut.total_input_tokens::INTEGER, ut.total_output_tokens::INTEGER) as credits_consumed
FROM users u
LEFT JOIN usage_tracking ut ON u.id = ut.user_id
WHERE ut.month = DATE_TRUNC('month', CURRENT_DATE);

-- Migrate existing usage data to credits
-- Convert minutes to approximate credits (1 minute ≈ 60 credits based on our calculations)
UPDATE usage_tracking
SET credits_balance = GREATEST(0, 40000 - (COALESCE(minutes_used, 0) * 60)::INTEGER),
    credits_purchased = 40000
WHERE credits_balance IS NULL OR credits_balance = 0;

-- Add comments for documentation
COMMENT ON TABLE credit_transactions IS 'Audit trail of all credit transactions';
COMMENT ON TABLE search_logs IS 'Tracks token usage and credits for search operations';
COMMENT ON FUNCTION calculate_credits IS 'Calculates credits from tokens with 10x markup';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deducts credits with validation';
COMMENT ON FUNCTION add_credits IS 'Adds credits from purchases or monthly allocation';
COMMENT ON FUNCTION get_credit_balance IS 'Gets current credit balance for a user';
COMMENT ON FUNCTION allocate_monthly_credits IS 'Allocates 40,000 monthly credits for pro users';