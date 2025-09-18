-- Migration: Complete Credit System Implementation
-- Purpose: Consolidated credit-based billing system with 10x markup on GPT-5 nano
-- Date: 2025-09-18
--
-- This migration consolidates all credit system functionality into one clean migration
-- Pricing: 1 credit = $0.001, with 10x markup on actual GPT-5 nano costs
-- Tiers: Free (1,000), Pro (40,000), Enterprise (100,000) credits per month

-- =====================================
-- 1. MODIFY USAGE TRACKING TABLE
-- =====================================
-- Add credit tracking columns to existing usage_tracking table
ALTER TABLE usage_tracking
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_input_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_output_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0;

-- =====================================
-- 2. CREATE CREDIT TRANSACTIONS TABLE
-- =====================================
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

-- =====================================
-- 3. CREATE SEARCH LOGS TABLE
-- =====================================
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

-- =====================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_video_id ON search_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);

-- =====================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================
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

-- =====================================
-- 6. CORE CREDIT CALCULATION FUNCTION
-- =====================================
-- Calculate credits from tokens with exact 10x markup
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

-- =====================================
-- 7. DEDUCT CREDITS FUNCTION
-- =====================================
-- Atomically deduct credits with balance validation
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

-- =====================================
-- 8. ADD CREDITS FUNCTION
-- =====================================
-- Add credits for purchases or monthly allocations
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

-- =====================================
-- 9. GET CREDIT BALANCE FUNCTION
-- =====================================
-- Get user's current credit balance
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

  -- Return 0 if no record exists (user needs to allocate credits)
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- 10. CREATE USAGE ANALYTICS VIEW
-- =====================================
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

-- =====================================
-- 11. ADD DOCUMENTATION COMMENTS
-- =====================================
COMMENT ON TABLE credit_transactions IS 'Audit trail of all credit transactions';
COMMENT ON TABLE search_logs IS 'Tracks token usage and credits for search operations';
COMMENT ON FUNCTION calculate_credits IS 'Calculates credits from tokens with 10x markup';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deducts credits with validation';
COMMENT ON FUNCTION add_credits IS 'Adds credits from purchases or monthly allocation';
COMMENT ON FUNCTION get_credit_balance IS 'Gets current credit balance for a user';

-- =====================================
-- 12. MIGRATE EXISTING DATA (if any)
-- =====================================
-- Convert any existing minute-based usage to approximate credits
-- This is a one-time migration for existing data
DO $$
BEGIN
  -- Only run if there's existing data without credits
  IF EXISTS (
    SELECT 1 FROM usage_tracking
    WHERE credits_balance = 0
    AND minutes_used > 0
  ) THEN
    -- Convert minutes to credits (1 minute ≈ 60 credits based on calculations)
    UPDATE usage_tracking
    SET
      credits_balance = GREATEST(0, 40000 - (COALESCE(minutes_used, 0) * 60)::INTEGER),
      credits_purchased = 40000
    WHERE credits_balance = 0;
  END IF;
END $$;