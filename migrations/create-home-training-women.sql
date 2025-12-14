-- Create Home Training Program for Women (No Equipment)
-- 3-day training program focused on bodyweight exercises
-- Run this SQL in your Supabase SQL Editor

DO $$
DECLARE
  program_id UUID;
  day1_template_id UUID;
  day2_template_id UUID;
  day3_template_id UUID;
BEGIN
  -- Note: This script creates a new program without deleting existing ones
  -- If you want to delete existing programs first, uncomment the DELETE statements below:
  -- DELETE FROM pro_programs WHERE title = 'Home Bodyweight Training';
  -- DELETE FROM workout_templates WHERE is_pro_program_template = TRUE AND name LIKE 'Day % - %' AND name LIKE '%Home%';
  
  -- Check if program already exists
  IF EXISTS (SELECT 1 FROM pro_programs WHERE title = 'Home Bodyweight Training') THEN
    RAISE NOTICE 'Home Bodyweight Training program already exists. Skipping creation.';
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
    'Home Bodyweight Training',
    'A complete 3-day bodyweight training program designed for women to do at home without any equipment. This program combines strength, cardio, and flexibility exercises to help you build strength, burn calories, and improve overall fitness from the comfort of your home.',
    'Beginner',
    3,
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO program_id;

  -- Step 2: Create Day 1 Template - Full Body Strength
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 1 - Full Body Strength',
    'Total body workout using bodyweight exercises to build strength and muscle tone',
    'Strength',
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
    'High-energy cardio workout combined with core strengthening exercises',
    'Cardio',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day2_template_id;

  -- Step 4: Create Day 3 Template - Lower Body & Glutes
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 3 - Lower Body & Glutes',
    'Lower body focused workout targeting legs, glutes, and core',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day3_template_id;

  -- Step 5: Create Pro Program Days
  INSERT INTO pro_program_days (
    pro_program_id,
    day_number,
    name,
    template_id,
    created_at
  ) VALUES
    (program_id, 1, 'Day 1 - Full Body Strength', day1_template_id, NOW()),
    (program_id, 2, 'Day 2 - Cardio & Core', day2_template_id, NOW()),
    (program_id, 3, 'Day 3 - Lower Body & Glutes', day3_template_id, NOW());

  -- Step 6: Insert Day 1 Exercises - Full Body Strength
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 1, 3, '15-20', NULL, 60 FROM exercises WHERE name = 'Bodyweight Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 2, 3, '10-15', NULL, 60 FROM exercises WHERE name = 'Pushups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 3, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Bodyweight Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 4, 3, '30-60', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 5, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Crunches' LIMIT 1;

  -- Step 7: Insert Day 2 Exercises - Cardio & Core
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 1, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 2, 3, '15-20', NULL, 30 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 3, 3, '20-25', NULL, 30 FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 4, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 5, 3, '10-12', NULL, 45 FROM exercises WHERE name = 'Pushups' LIMIT 1;

  -- Step 8: Insert Day 3 Exercises - Lower Body & Glutes
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 1, 4, '15-20', NULL, 60 FROM exercises WHERE name = 'Bodyweight Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 2, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Bodyweight Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 3, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Reverse Crunch' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 4, 3, '10-12', NULL, 45 FROM exercises WHERE name = 'Front Leg Raises' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 5, 3, '30-45', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;

  RAISE NOTICE 'Home Bodyweight Training Program created successfully! Program ID: %', program_id;
  RAISE NOTICE 'Day 1 Template ID: %', day1_template_id;
  RAISE NOTICE 'Day 2 Template ID: %', day2_template_id;
  RAISE NOTICE 'Day 3 Template ID: %', day3_template_id;
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
WHERE pp.title = 'Home Bodyweight Training'
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
WHERE pp.title = 'Home Bodyweight Training'
ORDER BY ppd.day_number, te.exercise_order;
