-- Migration: Convert Pro Programs to use Template IDs (Version 2)
-- This version handles the user_id constraint properly
-- 
-- IMPORTANT: Before running this migration, you need to:
-- 1. Either make user_id nullable for pro program templates, OR
-- 2. Use a system/admin user ID for pro program templates

-- Option A: Make user_id nullable for pro program templates (Recommended)
-- This allows pro program templates to exist without a specific user
ALTER TABLE workout_templates 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure regular templates still require user_id
ALTER TABLE workout_templates
ADD CONSTRAINT check_user_id_for_non_pro_program 
CHECK (
  (is_pro_program_template = TRUE AND user_id IS NULL) OR 
  (is_pro_program_template = FALSE AND user_id IS NOT NULL)
);

-- Step 1: Add template_id column to pro_program_days
ALTER TABLE pro_program_days 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL;

-- Step 2: Add is_pro_program_template flag to workout_templates
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS is_pro_program_template BOOLEAN DEFAULT FALSE;

-- Step 3: Create index for filtering
CREATE INDEX IF NOT EXISTS idx_workout_templates_is_pro_program ON workout_templates(is_pro_program_template);

-- Step 4: Migrate existing pro program day exercises to templates
-- This creates templates from existing pro_program_day_exercises
DO $$
DECLARE
  day_record RECORD;
  new_template_id UUID;
  exercise_record RECORD;
  order_counter INTEGER;
BEGIN
  -- Loop through each pro_program_day that doesn't have a template yet
  FOR day_record IN SELECT * FROM pro_program_days WHERE template_id IS NULL LOOP
    -- Create a new template for this day (user_id is NULL for pro program templates)
    INSERT INTO workout_templates (name, description, training_type, is_pro_program_template, user_id, created_at, updated_at)
    VALUES (
      day_record.name,
      'Pro Program Day',
      NULL,
      TRUE,
      NULL, -- NULL is now allowed for pro program templates
      day_record.created_at,
      NOW()
    )
    RETURNING id INTO new_template_id;
    
    -- Update pro_program_day with template_id
    UPDATE pro_program_days 
    SET template_id = new_template_id 
    WHERE id = day_record.id;
    
    -- Migrate exercises to template_exercises
    order_counter := 1;
    FOR exercise_record IN 
      SELECT * FROM pro_program_day_exercises 
      WHERE pro_program_day_id = day_record.id 
      ORDER BY exercise_order
    LOOP
      INSERT INTO template_exercises (
        template_id,
        exercise_id,
        exercise_order,
        sets,
        reps,
        weight,
        rest_seconds
      )
      VALUES (
        new_template_id,
        exercise_record.exercise_id,
        order_counter,
        exercise_record.sets,
        exercise_record.reps,
        exercise_record.weight,
        exercise_record.rest_seconds
      );
      
      order_counter := order_counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 5: Drop the pro_program_day_exercises table (no longer needed)
-- DROP TABLE IF EXISTS pro_program_day_exercises;

-- Note: Uncomment the DROP TABLE line above after verifying migration worked correctly

