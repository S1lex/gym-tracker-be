-- Weekly Schedule Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Weekly Schedule Table
CREATE TABLE IF NOT EXISTS weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_user_id ON weekly_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_day ON weekly_schedule(user_id, day_of_week);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_weekly_schedule_updated_at BEFORE UPDATE ON weekly_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;

-- Weekly Schedule Policies
CREATE POLICY "Users can view their own weekly schedule"
  ON weekly_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly schedule"
  ON weekly_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly schedule"
  ON weekly_schedule FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly schedule"
  ON weekly_schedule FOR DELETE
  USING (auth.uid() = user_id);

