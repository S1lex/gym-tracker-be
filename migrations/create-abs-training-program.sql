-- Create Abs & Core Training Program
-- 5-day training program focused on abdominal and core strength
-- Run this SQL in your Supabase SQL Editor

DO $$
DECLARE
  program_id UUID;
  day1_template_id UUID;
  day2_template_id UUID;
  day3_template_id UUID;
  day4_template_id UUID;
  day5_template_id UUID;
BEGIN
  -- Note: This script creates a new program without deleting existing ones
  -- If you want to delete existing programs first, uncomment the DELETE statements below:
  -- DELETE FROM pro_programs WHERE title = 'Abs & Core Builder';
  -- DELETE FROM workout_templates WHERE is_pro_program_template = TRUE AND name LIKE 'Day % - %' AND name LIKE '%Abs%';
  
  -- Check if program already exists
  IF EXISTS (SELECT 1 FROM pro_programs WHERE title = 'Abs & Core Builder') THEN
    RAISE NOTICE 'Abs & Core Builder program already exists. Skipping creation.';
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
    'Abs & Core Builder',
    'A comprehensive 5-day training program designed to build a strong, defined core and six-pack abs. This program targets all areas of your core including upper abs, lower abs, obliques, and deep core stability.',
    'Intermediate',
    5,
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO program_id;

  -- Step 2: Create Day 1 Template - Upper Abs Focus
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 1 - Upper Abs Focus',
    'Targeting the upper abdominal muscles with crunches and sit-ups',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day1_template_id;

  -- Step 3: Create Day 2 Template - Lower Abs Focus
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 2 - Lower Abs Focus',
    'Focusing on lower abdominal muscles with leg raises and reverse movements',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day2_template_id;

  -- Step 4: Create Day 3 Template - Obliques & Core Stability
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 3 - Obliques & Core Stability',
    'Targeting the side abs (obliques) and improving core stability',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day3_template_id;

  -- Step 5: Create Day 4 Template - Full Core Circuit
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 4 - Full Core Circuit',
    'Complete core workout targeting all abdominal muscles in a circuit format',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day4_template_id;

  -- Step 6: Create Day 5 Template - Advanced Core Strength
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 5 - Advanced Core Strength',
    'Advanced core exercises for building deep core strength and definition',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day5_template_id;

  -- Step 7: Create Pro Program Days
  INSERT INTO pro_program_days (
    pro_program_id,
    day_number,
    name,
    template_id,
    created_at
  ) VALUES
    (program_id, 1, 'Day 1 - Upper Abs Focus', day1_template_id, NOW()),
    (program_id, 2, 'Day 2 - Lower Abs Focus', day2_template_id, NOW()),
    (program_id, 3, 'Day 3 - Obliques & Core Stability', day3_template_id, NOW()),
    (program_id, 4, 'Day 4 - Full Core Circuit', day4_template_id, NOW()),
    (program_id, 5, 'Day 5 - Advanced Core Strength', day5_template_id, NOW());

  -- Step 8: Insert Day 1 Exercises - Upper Abs Focus
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 1, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Crunches' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 2, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Cable Crunch' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 3, 3, '10-15', NULL, 45 FROM exercises WHERE name = 'Sit-Up' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 4, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Decline Crunch' LIMIT 1;

  -- Step 9: Insert Day 2 Exercises - Lower Abs Focus
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 1, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Hanging Leg Raise' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 2, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Reverse Crunch' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 3, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Decline Reverse Crunch' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 4, 3, '10-12', NULL, 45 FROM exercises WHERE name = 'Flat Bench Lying Leg Raise' LIMIT 1;

  -- Step 10: Insert Day 3 Exercises - Obliques & Core Stability
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 1, 4, '20-25', NULL, 45 FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 2, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Oblique Crunches' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 3, 3, '30-60', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 4, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Cable Russian Twists' LIMIT 1;

  -- Step 11: Insert Day 4 Exercises - Full Core Circuit
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 1, 3, '15-20', NULL, 30 FROM exercises WHERE name = 'Crunches' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 2, 3, '12-15', NULL, 30 FROM exercises WHERE name = 'Hanging Leg Raise' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 3, 3, '20-25', NULL, 30 FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 4, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;

  -- Step 12: Insert Day 5 Exercises - Advanced Core Strength
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 1, 4, '10-15', NULL, 60 FROM exercises WHERE name = 'Ab Roller' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 2, 4, '8-12', NULL, 60 FROM exercises WHERE name = 'Hanging Pike' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 3, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Cable Crunch' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 4, 3, '60-90', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;

  RAISE NOTICE 'Abs & Core Builder Program created successfully! Program ID: %', program_id;
  RAISE NOTICE 'Day 1 Template ID: %', day1_template_id;
  RAISE NOTICE 'Day 2 Template ID: %', day2_template_id;
  RAISE NOTICE 'Day 3 Template ID: %', day3_template_id;
  RAISE NOTICE 'Day 4 Template ID: %', day4_template_id;
  RAISE NOTICE 'Day 5 Template ID: %', day5_template_id;
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
WHERE pp.title = 'Abs & Core Builder'
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
WHERE pp.title = 'Abs & Core Builder'
ORDER BY ppd.day_number, te.exercise_order;
