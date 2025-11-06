-- Migration Option 1: Import exercises from exercises.exercise to public.exercises with UUIDs
-- This creates UUID entries in public.exercises that match exercises.exercise
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Ensure public.exercises table exists (from schema.sql)
-- If it doesn't exist, run this first:
-- Note: If you already have this table, you can skip this step
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  instructions TEXT,
  video_url TEXT  -- Optional field, can be NULL
);

-- Step 2: Copy exercises from exercises.exercise to public.exercises
-- This will create UUID entries for all exercises
-- Only insert exercises that don't already exist (by name)
-- Note: public.exercises table structure may differ, so we map what we can
INSERT INTO public.exercises (name, category, instructions)
SELECT DISTINCT
  e.name as name,
  e.category,
  -- Convert instructions array to text (take first element or join)
  CASE 
    WHEN e.instructions IS NULL THEN NULL
    WHEN array_length(e.instructions, 1) > 0 THEN array_to_string(e.instructions, E'\n')
    ELSE NULL
  END as instructions
FROM exercises.exercise e
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises pe 
  WHERE pe.name = e.name
)
ON CONFLICT DO NOTHING;

-- Step 3: Create a mapping table to track the relationship
-- This helps if you need to reference exercises by their original ID
CREATE TABLE IF NOT EXISTS exercise_id_mapping (
  original_id TEXT PRIMARY KEY,  -- The ID from exercises.exercise (e.g., "Ab_Crunch_Machine")
  exercise_name TEXT NOT NULL,    -- The exercise name
  uuid_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Populate the mapping table
INSERT INTO exercise_id_mapping (original_id, exercise_name, uuid_id)
SELECT 
  e.id as original_id,  -- e.id is already TEXT
  e.name as exercise_name,
  pe.id as uuid_id
FROM exercises.exercise e
JOIN public.exercises pe ON pe.name = e.name
ON CONFLICT (original_id) DO NOTHING;

-- Step 5: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_id_mapping_original_id ON exercise_id_mapping(original_id);
CREATE INDEX IF NOT EXISTS idx_exercise_id_mapping_uuid_id ON exercise_id_mapping(uuid_id);
CREATE INDEX IF NOT EXISTS idx_exercise_id_mapping_exercise_name ON exercise_id_mapping(exercise_name);

-- Step 6: Verify the migration
-- Check how many exercises were imported:
SELECT COUNT(*) as total_exercises FROM public.exercises;
SELECT COUNT(*) as mapped_exercises FROM exercise_id_mapping;

-- Step 7: View sample mappings
SELECT 
  eim.original_id,
  eim.exercise_name,
  eim.uuid_id,
  pe.name as public_exercise_name
FROM exercise_id_mapping eim
JOIN public.exercises pe ON pe.id = eim.uuid_id
LIMIT 10;

