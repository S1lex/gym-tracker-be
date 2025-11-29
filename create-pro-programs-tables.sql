-- Pro Programs Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Pro Programs Table
CREATE TABLE IF NOT EXISTS pro_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL, -- Beginner, Intermediate, Advanced
  days_per_week INTEGER NOT NULL CHECK (days_per_week >= 3 AND days_per_week <= 5),
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pro Program Days Table
CREATE TABLE IF NOT EXISTS pro_program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_program_id UUID NOT NULL REFERENCES pro_programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 5),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pro Program Day Exercises Table (similar to template_exercises)
CREATE TABLE IF NOT EXISTS pro_program_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_program_day_id UUID NOT NULL REFERENCES pro_program_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT,
  weight DECIMAL(10, 2),
  rest_seconds INTEGER
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pro_program_days_program_id ON pro_program_days(pro_program_id);
CREATE INDEX IF NOT EXISTS idx_pro_program_days_day_number ON pro_program_days(pro_program_id, day_number);
CREATE INDEX IF NOT EXISTS idx_pro_program_day_exercises_day_id ON pro_program_day_exercises(pro_program_day_id);
CREATE INDEX IF NOT EXISTS idx_pro_program_day_exercises_exercise_id ON pro_program_day_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pro_program_day_exercises_order ON pro_program_day_exercises(pro_program_day_id, exercise_order);

-- Trigger to automatically update updated_at for pro_programs
CREATE TRIGGER update_pro_programs_updated_at BEFORE UPDATE ON pro_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Pro Programs table is public (no RLS needed - anyone can view pro programs)
-- Pro programs are read-only for regular users, only admins can create/update/delete

-- Sample data (optional - you can insert via API)
-- This is just an example structure

