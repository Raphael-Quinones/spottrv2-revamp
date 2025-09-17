-- Add detailed token tracking to video_analysis table
ALTER TABLE video_analysis
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS model_used TEXT;

-- Add cost tracking to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS total_input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_output_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_image_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_cost_usd DECIMAL(10, 6);

-- Create detailed cost tracking table
CREATE TABLE IF NOT EXISTS processing_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  image_tokens INTEGER,
  input_cost_usd DECIMAL(10, 6),
  output_cost_usd DECIMAL(10, 6),
  total_cost_usd DECIMAL(10, 6),
  grid_number INTEGER,
  frame_count INTEGER
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_processing_costs_video_id ON processing_costs(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_processing_cost ON videos(processing_cost_usd);

-- Create view for cost analytics by model
CREATE OR REPLACE VIEW cost_by_model AS
SELECT
  accuracy_level as model,
  COUNT(*) as video_count,
  AVG(processing_cost_usd) as avg_cost,
  SUM(processing_cost_usd) as total_cost,
  AVG(CASE
    WHEN duration_seconds > 0
    THEN processing_cost_usd / (duration_seconds / 60.0)
    ELSE NULL
  END) as avg_cost_per_minute
FROM videos
WHERE status = 'completed' AND processing_cost_usd IS NOT NULL
GROUP BY accuracy_level;

-- Create view for monthly cost trends
CREATE OR REPLACE VIEW monthly_costs AS
SELECT
  user_id,
  DATE_TRUNC('month', processed_at) as month,
  COUNT(*) as videos_processed,
  SUM(processing_cost_usd) as total_cost,
  AVG(processing_cost_usd) as avg_cost_per_video,
  SUM(total_input_tokens) as total_input_tokens,
  SUM(total_output_tokens) as total_output_tokens
FROM videos
WHERE status = 'completed' AND processing_cost_usd IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', processed_at);