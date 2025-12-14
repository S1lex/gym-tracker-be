-- Update User Goals Table to support new goal types
-- Run this SQL in your Supabase SQL Editor

-- Drop existing check constraint
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_goal_type_check;
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_unit_check;

-- Add updated check constraints
ALTER TABLE user_goals ADD CONSTRAINT user_goals_goal_type_check 
  CHECK (goal_type IN ('body_weight', 'exercise_weight', 'exercise_reps', 'body_measurement', 'custom', 'training_count_per_week'));

ALTER TABLE user_goals ADD CONSTRAINT user_goals_unit_check 
  CHECK (unit IN ('kg', 'lbs', 'cm', 'in', '%', 'reps', 'sets', 'workouts'));

