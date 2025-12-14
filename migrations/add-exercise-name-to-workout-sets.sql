-- Add exercise_name column to workout_sets table
-- This allows storing the exercise name at the time of the workout for historical accuracy

ALTER TABLE workout_sets 
ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_name ON workout_sets(exercise_name);

-- Update existing records to populate exercise_name from exercises table
UPDATE workout_sets ws
SET exercise_name = e.name
FROM exercises e
WHERE ws.exercise_id = e.id 
  AND ws.exercise_name IS NULL;

