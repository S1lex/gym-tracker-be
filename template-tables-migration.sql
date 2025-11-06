-- Template Tables Migration
-- Run this SQL in your Supabase SQL Editor
-- This creates the workout_templates and template_exercises tables

-- First, check which exercises table exists
-- If you get an error about exercises table not existing, check the table name:
-- It might be 'exercise' (singular) instead of 'exercises' (plural)

-- Workout Templates Table
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Exercises Table
-- NOTE: If your exercises table is named 'exercise' (singular), 
-- change 'exercises' to 'exercise' in the foreign key reference below
CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT,
  weight DECIMAL(10, 2),
  rest_seconds INTEGER
);

-- Indexes for template tables
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_exercise_id ON template_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_order ON template_exercises(template_id, exercise_order);

-- Trigger to automatically update updated_at for workout_templates
-- (Assuming update_updated_at_column function already exists)
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies for templates
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

-- Workout Templates Policies
CREATE POLICY "Users can view their own templates"
  ON workout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON workout_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Template Exercises Policies
CREATE POLICY "Users can view exercises from their templates"
  ON template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exercises to their templates"
  ON template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises from their templates"
  ON template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from their templates"
  ON template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );
