-- Add support for demo videos that all users can access

-- Add is_demo column to videos table
ALTER TABLE videos
ADD COLUMN is_demo BOOLEAN DEFAULT false;

-- Create index for demo videos
CREATE INDEX idx_videos_is_demo ON videos(is_demo) WHERE is_demo = true;

-- Update RLS policies to allow viewing demo videos

-- Drop existing policy and recreate with demo support
DROP POLICY IF EXISTS "Users can view own videos" ON videos;

CREATE POLICY "Users can view own videos or demo videos" ON videos
    FOR SELECT USING (
        auth.uid() = user_id
        OR is_demo = true
    );

-- Add policy for video_analysis table to allow viewing demo video analysis
CREATE POLICY "Users can view analysis of demo videos" ON video_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = video_analysis.video_id
            AND videos.is_demo = true
        )
    );

-- Add comment for documentation
COMMENT ON COLUMN videos.is_demo IS 'Flag to mark videos as demos accessible to all authenticated users';