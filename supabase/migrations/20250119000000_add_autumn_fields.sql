-- Add Autumn subscription tracking fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS autumn_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS autumn_product_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_autumn_subscription_id ON users(autumn_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_autumn_product_id ON users(autumn_product_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();