-- Migration: Update schema refactor
-- Purpose: Rename search_prompt to analysis_scope and remove search_results table
-- Date: 2025-09-13

-- 1. Rename search_prompt column to analysis_scope in videos table
ALTER TABLE videos
RENAME COLUMN search_prompt TO analysis_scope;

-- 2. Drop search_results table and its dependencies
-- Drop policies first
DROP POLICY IF EXISTS "Users can view search results of own videos" ON search_results;
DROP POLICY IF EXISTS "Users can insert search results for own videos" ON search_results;

-- Drop indexes
DROP INDEX IF EXISTS idx_search_results_video_id;
DROP INDEX IF EXISTS idx_search_results_query;

-- Drop the table
DROP TABLE IF EXISTS search_results;

-- Note: The schema is now simplified with client-side search on pre-analyzed data