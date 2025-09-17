-- Drop the automatic processing trigger that changes status when queued
-- This trigger was causing videos to show as "processing" immediately after upload
-- without actually starting any processing

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_video_queued ON processing_queue;

-- Drop the function
DROP FUNCTION IF EXISTS update_video_processing_status();

-- Comment for documentation
COMMENT ON TABLE processing_queue IS 'Queue for videos waiting to be processed. Status must be manually updated when processing starts.';