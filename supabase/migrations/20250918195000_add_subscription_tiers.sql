-- Migration: Add new subscription tiers
-- Purpose: Add 'starter' and 'business' tiers to subscription_tier enum
-- Date: 2025-09-18

-- Add new values to subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'starter' AFTER 'free';
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'business' AFTER 'pro';