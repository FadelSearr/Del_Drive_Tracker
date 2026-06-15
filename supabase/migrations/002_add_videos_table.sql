-- Migration: Add videos table for dashcam recordings
-- Run this in your Supabase SQL Editor

-- Create videos table (without trips FK for now)
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL, -- Just store trip ID as text, no FK constraint
  file_path TEXT NOT NULL, -- Local device path
  cloud_url TEXT, -- Supabase Storage URL (NULL if not synced)
  duration INTEGER NOT NULL, -- Duration in seconds
  file_size BIGINT NOT NULL, -- File size in bytes
  recording_started_at TIMESTAMPTZ NOT NULL,
  recording_ended_at TIMESTAMPTZ,
  camera_type TEXT DEFAULT 'back', -- 'back' or 'front'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_trip_id ON videos(trip_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own videos
CREATE POLICY "Users can view own videos"
  ON videos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own videos
CREATE POLICY "Users can insert own videos"
  ON videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own videos (for cloud_url sync)
CREATE POLICY "Users can update own videos"
  ON videos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos"
  ON videos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE videos IS 'Stores metadata for dashcam video recordings';
COMMENT ON COLUMN videos.file_path IS 'Local device path';
COMMENT ON COLUMN videos.cloud_url IS 'Supabase Storage URL after cloud sync';
COMMENT ON COLUMN videos.trip_id IS 'Reference to trip ID (stored as text)';
COMMENT ON COLUMN videos.duration IS 'Video duration in seconds';
COMMENT ON COLUMN videos.file_size IS 'File size in bytes';
COMMENT ON COLUMN videos.camera_type IS 'Camera used: back or front';
COMMENT ON COLUMN videos.user_id IS 'Owner of the video';
