-- Helper function to get UUID from exercise name or ID
-- This can be used in queries to convert exercise names to UUIDs
CREATE OR REPLACE FUNCTION get_exercise_uuid(exercise_identifier TEXT)
RETURNS UUID AS $$
DECLARE
  result_uuid UUID;
BEGIN
  -- First try to find by original_id (e.g., "Ab_Crunch_Machine")
  SELECT uuid_id INTO result_uuid
  FROM exercise_id_mapping
  WHERE original_id = exercise_identifier;
  
  -- If not found, try by exercise name
  IF result_uuid IS NULL THEN
    SELECT uuid_id INTO result_uuid
    FROM exercise_id_mapping
    WHERE exercise_name = exercise_identifier;
  END IF;
  
  -- If still not found, try directly in public.exercises by name
  IF result_uuid IS NULL THEN
    SELECT id INTO result_uuid
    FROM public.exercises
    WHERE name = exercise_identifier;
  END IF;
  
  RETURN result_uuid;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT get_exercise_uuid('Ab_Crunch_Machine');
-- This will return the UUID for that exercise

