-- Create table to track user progress on PRO program days
-- This table tracks which days from PRO programs users have completed
-- Run this SQL in your Supabase SQL Editor

-- User Pro Program Progress Table
CREATE TABLE IF NOT EXISTS user_pro_program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pro_program_id UUID NOT NULL REFERENCES pro_programs(id) ON DELETE CASCADE,
  pro_program_day_id UUID NOT NULL REFERENCES pro_program_days(id) ON DELETE CASCADE,
  workout_history_id UUID REFERENCES workouts(id) ON DELETE SET NULL, -- Link to the workout that completed this day
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only complete a day once (can be reset if needed by deleting the record)
  UNIQUE(user_id, pro_program_day_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_pro_program_progress_user_id ON user_pro_program_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pro_program_progress_program_id ON user_pro_program_progress(pro_program_id);
CREATE INDEX IF NOT EXISTS idx_user_pro_program_progress_day_id ON user_pro_program_progress(pro_program_day_id);
CREATE INDEX IF NOT EXISTS idx_user_pro_program_progress_user_program ON user_pro_program_progress(user_id, pro_program_id);

-- Row Level Security (RLS) Policies
ALTER TABLE user_pro_program_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own pro program progress"
  ON user_pro_program_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress (when they complete a day)
CREATE POLICY "Users can insert their own pro program progress"
  ON user_pro_program_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress (to reset progress)
CREATE POLICY "Users can delete their own pro program progress"
  ON user_pro_program_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE user_pro_program_progress IS 'Tracks which PRO program days users have completed';
COMMENT ON COLUMN user_pro_program_progress.pro_program_id IS 'The PRO program this progress belongs to';
COMMENT ON COLUMN user_pro_program_progress.pro_program_day_id IS 'The specific day that was completed';
COMMENT ON COLUMN user_pro_program_progress.workout_history_id IS 'Optional link to the workout history record that completed this day';
