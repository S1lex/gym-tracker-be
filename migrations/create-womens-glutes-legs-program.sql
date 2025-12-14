-- Create Women's Glutes & Legs Program
-- 3-day training program focused on glutes and legs development
-- Run this SQL in your Supabase SQL Editor

DO $$
DECLARE
  program_id UUID;
  day1_template_id UUID;
  day2_template_id UUID;
  day3_template_id UUID;
  deleted_programs_count INTEGER;
  deleted_templates_count INTEGER;
BEGIN
  -- Step 0: Delete all existing PRO programs and their templates
  -- First, delete all pro programs (this will cascade delete pro_program_days)
  DELETE FROM pro_programs;
  GET DIAGNOSTICS deleted_programs_count = ROW_COUNT;
  
  -- Then, delete all pro program templates (this will cascade delete template_exercises)
  DELETE FROM workout_templates WHERE is_pro_program_template = TRUE;
  GET DIAGNOSTICS deleted_templates_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % existing PRO programs', deleted_programs_count;
  RAISE NOTICE 'Deleted % existing PRO program templates', deleted_templates_count;

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
    'Glutes & Legs Builder',
    'A comprehensive 3-day training program designed specifically for women to build strong, shapely glutes and powerful legs. This program focuses on progressive overload with a mix of compound and isolation exercises targeting glutes, quads, and hamstrings.',
    'Intermediate',
    3,
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id INTO program_id;

  -- Step 2: Create Day 1 Template - Glutes Focus
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 1 - Glutes Focus',
    'Heavy glute-focused training with hip thrusts, glute bridges, and glute isolation work',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day1_template_id;

  -- Step 3: Create Day 2 Template - Quads & Glutes
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 2 - Quads & Glutes',
    'Quad-dominant training with squats, leg press, and step-ups for lower body power',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day2_template_id;

  -- Step 4: Create Day 3 Template - Hamstrings & Glutes
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 3 - Hamstrings & Glutes',
    'Posterior chain focus with Romanian deadlifts, leg curls, and glute activation',
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
    (program_id, 1, 'Day 1 - Glutes Focus', day1_template_id, NOW()),
    (program_id, 2, 'Day 2 - Quads & Glutes', day2_template_id, NOW()),
    (program_id, 3, 'Day 3 - Hamstrings & Glutes', day3_template_id, NOW());

  -- Step 6: Insert Day 1 Exercises - Glutes Focus
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 1, 4, '8-10', NULL, 90 FROM exercises WHERE name = 'Barbell Hip Thrust' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 2, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Barbell Glute Bridge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 3, 3, '10-12', NULL, 90 FROM exercises WHERE name = 'Split Squat with Dumbbells' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 4, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Dumbbell Step Ups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 5, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Cable Hip Adduction' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 6, 3, '12-15', NULL, 45 FROM exercises WHERE name = 'Single Leg Glute Bridge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 7, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Calf Raise On A Dumbbell' LIMIT 1;

  -- Step 7: Insert Day 2 Exercises - Quads & Glutes
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 1, 4, '8-10', NULL, 120 FROM exercises WHERE name = 'Barbell Full Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 2, 4, '12-15', NULL, 90 FROM exercises WHERE name = 'Leg Press' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 3, 3, '10-12', NULL, 90 FROM exercises WHERE name = 'Barbell Step Ups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 4, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Leg Extensions' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 5, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Barbell Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 6, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Goblet Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 7, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Calf Press On The Leg Press Machine' LIMIT 1;

  -- Step 8: Insert Day 3 Exercises - Hamstrings & Glutes
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 1, 4, '8-10', NULL, 120 FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 2, 4, '10-12', NULL, 90 FROM exercises WHERE name = 'Barbell Hip Thrust' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 3, 4, '12-15', NULL, 60 FROM exercises WHERE name = 'Lying Leg Curls' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 4, 3, '6-8', NULL, 120 FROM exercises WHERE name = 'Barbell Deadlift' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 5, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Glute Kickback' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 6, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Hip Extension with Bands' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 7, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Donkey Calf Raises' LIMIT 1;

  RAISE NOTICE 'Program created successfully! Program ID: %', program_id;
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
WHERE pp.title = 'Glutes & Legs Builder'
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
WHERE pp.title = 'Glutes & Legs Builder'
ORDER BY ppd.day_number, te.exercise_order;
