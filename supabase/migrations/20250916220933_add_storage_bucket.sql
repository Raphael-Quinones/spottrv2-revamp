-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/mov']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/mov']::text[];

-- Create RLS policies for video storage
CREATE POLICY "Users can upload their own videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add function to get video metadata from storage URL
CREATE OR REPLACE FUNCTION get_video_metadata(p_storage_path TEXT)
RETURNS JSONB AS $$
DECLARE
    v_metadata JSONB;
BEGIN
    -- This function will be called after upload to extract video metadata
    -- For now, return empty object - actual implementation would use ffprobe
    RETURN '{}'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update video status when processing starts
CREATE OR REPLACE FUNCTION update_video_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a video is added to processing queue, update its status
    UPDATE videos
    SET status = 'processing',
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.video_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_video_queued
    AFTER INSERT ON processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_video_processing_status();