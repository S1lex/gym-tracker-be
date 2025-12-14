-- Add RLS Policies for Pro Program Templates
-- This allows all authenticated users to read pro program templates
-- Run this SQL in your Supabase SQL Editor

-- Policy: Allow all authenticated users to view pro program templates
CREATE POLICY "Anyone can view pro program templates"
  ON workout_templates FOR SELECT
  USING (is_pro_program_template = TRUE);

-- Policy: Allow all authenticated users to view exercises from pro program templates
CREATE POLICY "Anyone can view exercises from pro program templates"
  ON template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.is_pro_program_template = TRUE
    )
  );

-- Note: These policies work alongside existing policies
-- - Users can still only modify their own templates
-- - Pro program templates are read-only for regular users
