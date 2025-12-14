-- Migration: Change template_exercises.exercise_id to reference exercises.exercise
-- This allows using exercise names as IDs instead of UUIDs
-- Run this SQL in your Supabase SQL Editor

-- IMPORTANT: Before running this migration, make sure:
-- 1. The exercises.exercise table exists in the 'exercises' schema
-- 2. The exercise.id column in exercises.exercise is TEXT type (or compatible)
-- 3. You have no existing data in template_exercises that needs to be preserved

-- Step 1: Drop the existing foreign key constraint (if it exists)
ALTER TABLE template_exercises 
  DROP CONSTRAINT IF EXISTS template_exercises_exercise_id_fkey;

-- Step 2: Check if there's existing data that needs to be migrated
-- If you have existing template_exercises with UUID exercise_ids, you'll need to:
-- 1. Map those UUIDs to exercise names from public.exercises
-- 2. Then run this migration
-- For now, we'll assume template_exercises is empty or you want to start fresh

-- Step 3: Change the exercise_id column type from UUID to TEXT
-- This allows storing exercise names like "Ab_Crunch_Machine"
-- Note: This will fail if there's existing UUID data - convert it first if needed
ALTER TABLE template_exercises 
  ALTER COLUMN exercise_id TYPE TEXT USING exercise_id::TEXT;

-- Step 4: Add new foreign key constraint to exercises.exercise table
-- This references the exercise table in the 'exercises' schema
-- PostgreSQL will automatically handle the cross-schema reference
ALTER TABLE template_exercises 
  ADD CONSTRAINT template_exercises_exercise_id_fkey 
  FOREIGN KEY (exercise_id) 
  REFERENCES exercises.exercise(id) 
  ON DELETE CASCADE;

-- Step 5: Verify the constraint was created
-- Run this query to verify:
-- SELECT 
--   tc.constraint_name, 
--   tc.table_schema, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_schema AS foreign_table_schema,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name='template_exercises' AND tc.constraint_type='FOREIGN KEY';

