-- Disable RLS for development - to be re-enabled in production
-- This removes all RLS policies to simplify development

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_costs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;
DROP POLICY IF EXISTS "Users can view analysis of own videos" ON video_analysis;
DROP POLICY IF EXISTS "Service role can manage processing queue" ON processing_queue;
DROP POLICY IF EXISTS "Users can queue own videos" ON processing_queue;
DROP POLICY IF EXISTS "Users can view own queue items" ON processing_queue;
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Service role can manage all usage" ON usage_tracking;

-- Storage policies (if they exist)
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Note: RLS is now disabled for development
-- Remember to re-enable and recreate policies before production deployment