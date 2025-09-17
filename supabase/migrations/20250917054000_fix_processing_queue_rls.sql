-- Fix processing queue RLS to allow users to queue their own videos
-- Previously only service_role could insert, which caused errors

-- Allow authenticated users to add their own videos to processing queue
CREATE POLICY "Users can queue own videos" ON processing_queue
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = processing_queue.video_id
            AND videos.user_id = auth.uid()
        )
    );

-- Also allow users to view their own queued items
CREATE POLICY "Users can view own queue items" ON processing_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = processing_queue.video_id
            AND videos.user_id = auth.uid()
        )
    );