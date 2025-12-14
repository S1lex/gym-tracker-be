-- User Goals Database Schema
-- Run this SQL in your Supabase SQL Editor

-- User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('body_weight', 'exercise_weight', 'exercise_reps', 'body_measurement', 'custom', 'training_count_per_week')),
  goal_title TEXT NOT NULL,
  target_value DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'lbs', 'cm', 'in', '%', 'reps', 'sets', 'workouts')),
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL, -- For exercise-specific goals
  measurement_type TEXT CHECK (measurement_type IN ('weight', 'body_fat_percentage', 'neck', 'shoulders', 'chest', 'left_bicep', 'right_bicep', 'left_forearm', 'right_forearm', 'waist', 'hips', 'left_thigh', 'right_thigh', 'left_calf', 'right_calf')), -- For body measurement goals
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_goals_type ON user_goals(user_id, goal_type);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- User Goals Policies
CREATE POLICY "Users can view their own goals"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON user_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON user_goals FOR DELETE
  USING (auth.uid() = user_id);

