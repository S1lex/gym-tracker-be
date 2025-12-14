-- Create Fat Burning & Weight Loss Program
-- 4-day training program focused on high-intensity fat burning
-- Run this SQL in your Supabase SQL Editor

DO $$
DECLARE
  program_id UUID;
  day1_template_id UUID;
  day2_template_id UUID;
  day3_template_id UUID;
  day4_template_id UUID;
BEGIN
  -- Note: This script creates a new program without deleting existing ones
  -- If you want to delete existing programs first, uncomment the DELETE statements below:
  -- DELETE FROM pro_programs WHERE title = 'Fat Burner Challenge';
  -- DELETE FROM workout_templates WHERE is_pro_program_template = TRUE AND name LIKE 'Day % - %' AND name LIKE '%Fat Burner%';
  
  -- Check if program already exists
  IF EXISTS (SELECT 1 FROM pro_programs WHERE title = 'Fat Burner Challenge') THEN
    RAISE NOTICE 'Fat Burner Challenge program already exists. Skipping creation.';
    RETURN;
  END IF;

  -- Step 1: Create the Pro Program
  INSERT INTO pro_programs (
    title,
    description,
    level,
    days_per_week,
    images,
    created_at,
    updated_at
  ) VALUES (
    'Fat Burner Challenge',
    'A high-intensity 4-day training program designed to maximize fat burning and accelerate weight loss. This program combines HIIT, full-body movements, and metabolic conditioning to boost your metabolism and torch calories.',
    'Intermediate',
    4,
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO program_id;

  -- Step 2: Create Day 1 Template - Full Body HIIT
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 1 - Full Body HIIT',
    'High-intensity interval training targeting the entire body with explosive movements',
    'HIIT',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day1_template_id;

  -- Step 3: Create Day 2 Template - Cardio & Core
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 2 - Cardio & Core',
    'Cardiovascular training combined with core strengthening for maximum calorie burn',
    'Cardio',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day2_template_id;

  -- Step 4: Create Day 3 Template - Strength & Cardio Mix
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 3 - Strength & Cardio Mix',
    'Metabolic conditioning combining strength movements with cardiovascular elements',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day3_template_id;

  -- Step 5: Create Day 4 Template - Active Recovery & Cardio
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 4 - Active Recovery & Cardio',
    'Lower intensity cardio and active recovery to maintain calorie burn while allowing recovery',
    'Cardio',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day4_template_id;

  -- Step 6: Create Pro Program Days
  INSERT INTO pro_program_days (
    pro_program_id,
    day_number,
    name,
    template_id,
    created_at
  ) VALUES
    (program_id, 1, 'Day 1 - Full Body HIIT', day1_template_id, NOW()),
    (program_id, 2, 'Day 2 - Cardio & Core', day2_template_id, NOW()),
    (program_id, 3, 'Day 3 - Strength & Cardio Mix', day3_template_id, NOW()),
    (program_id, 4, 'Day 4 - Active Recovery & Cardio', day4_template_id, NOW());

  -- Step 7: Insert Day 1 Exercises - Full Body HIIT
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 1, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 2, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 3, 4, '12-15', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 4, 4, '10-15', NULL, 45 FROM exercises WHERE name = 'Box Jump (Multiple Response)' LIMIT 1;

  -- Step 8: Insert Day 2 Exercises - Cardio & Core
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 1, 3, '500m', NULL, 60 FROM exercises WHERE name = 'Rowing, Stationary' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 2, 4, '30-45', NULL, 30 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 3, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 4, 3, '45-60', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;

  -- Step 9: Insert Day 3 Exercises - Strength & Cardio Mix
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 1, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'One-Arm Kettlebell Swings' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 2, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Kettlebell Thruster' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 3, 4, '10-12', NULL, 60 FROM exercises WHERE name = 'Clean and Press' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 4, 3, '20-25', NULL, 30 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;

  -- Step 10: Insert Day 4 Exercises - Active Recovery & Cardio
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 1, 3, '20-30 min', NULL, 0 FROM exercises WHERE name = 'Running, Treadmill' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 2, 3, '5-10 min', NULL, 0 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 3, 3, '30-45', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 4, 3, '60-90', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;

  RAISE NOTICE 'Fat Burning Program created successfully! Program ID: %', program_id;
  RAISE NOTICE 'Day 1 Template ID: %', day1_template_id;
  RAISE NOTICE 'Day 2 Template ID: %', day2_template_id;
  RAISE NOTICE 'Day 3 Template ID: %', day3_template_id;
  RAISE NOTICE 'Day 4 Template ID: %', day4_template_id;
END $$;

-- Verification Query - Run this separately to see the created program
SELECT 
  pp.id as program_id,
  pp.title,
  pp.description,
  pp.level,
  pp.days_per_week,
  ppd.day_number,
  ppd.name as day_name,
  wt.name as template_name,
  wt.description as template_description,
  COUNT(te.id) as exercise_count
FROM pro_programs pp
JOIN pro_program_days ppd ON pp.id = ppd.pro_program_id
LEFT JOIN workout_templates wt ON ppd.template_id = wt.id
LEFT JOIN template_exercises te ON wt.id = te.template_id
WHERE pp.title = 'Fat Burner Challenge'
GROUP BY pp.id, pp.title, pp.description, pp.level, pp.days_per_week, ppd.day_number, ppd.name, wt.name, wt.description
ORDER BY ppd.day_number;

-- Detailed Exercise List Query - Run this to see all exercises in the program
SELECT 
  pp.title as program_title,
  ppd.day_number,
  ppd.name as day_name,
  e.name as exercise_name,
  te.exercise_order,
  te.sets,
  te.reps,
  te.rest_seconds
FROM pro_programs pp
JOIN pro_program_days ppd ON pp.id = ppd.pro_program_id
JOIN workout_templates wt ON ppd.template_id = wt.id
JOIN template_exercises te ON wt.id = te.template_id
JOIN exercises e ON te.exercise_id = e.id
WHERE pp.title = 'Fat Burner Challenge'
ORDER BY ppd.day_number, te.exercise_order;
