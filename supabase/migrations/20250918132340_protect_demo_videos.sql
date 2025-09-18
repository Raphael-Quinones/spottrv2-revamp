-- Protect demo videos from deletion
-- This migration updates the delete policy to prevent deletion of demo videos

-- Drop the existing delete policy
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;

-- Create new policy that prevents deletion of demo videos
CREATE POLICY "Users can delete own videos but not demos" ON videos
    FOR DELETE USING (
        auth.uid() = user_id
        AND is_demo = false
    );

-- Also update the video_analysis table to prevent deletion of demo video analysis
DROP POLICY IF EXISTS "Users can manage own video analysis" ON video_analysis;

CREATE POLICY "Users can delete own video analysis but not demos" ON video_analysis
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = video_analysis.video_id
            AND videos.user_id = auth.uid()
            AND videos.is_demo = false
        )
    );

-- Add a check constraint to prevent updates that would remove the demo flag
ALTER TABLE videos DROP CONSTRAINT IF EXISTS protect_demo_flag;
ALTER TABLE videos ADD CONSTRAINT protect_demo_flag
    CHECK (
        NOT (is_demo = false AND id = '5728109e-abb3-43af-b0ff-88360b9a5adc')
    );

-- Add comment explaining the protection
COMMENT ON CONSTRAINT protect_demo_flag ON videos IS 'Prevents removing the demo flag from designated demo videos';