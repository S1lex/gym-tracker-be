-- Add training_type column to workout_templates table
-- Run this SQL in your Supabase SQL Editor

-- Add training_type column (nullable TEXT to allow existing templates without a type)
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS training_type TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN workout_templates.training_type IS 'Training type identifier (e.g., chest, arms, legs, upper_body, lower_body, etc.)';

