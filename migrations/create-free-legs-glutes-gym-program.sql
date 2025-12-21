-- Create FREE Pro Program: Legs & Glutes: Gym edition
-- 3-day training program focused on legs and glutes development with gym equipment
-- This is a FREE plan available to all users
-- Run this SQL in your Supabase SQL Editor

DO $$
DECLARE
  program_id UUID;
  day1_template_id UUID;
  day2_template_id UUID;
  day3_template_id UUID;
BEGIN
  -- Step 1: Create the Pro Program with free_plan = true
  INSERT INTO pro_programs (
    title,
    description,
    level,
    days_per_week,
    images,
    free_plan,
    created_at,
    updated_at
  ) VALUES (
    'Legs & Glutes: Gym edition',
    'A comprehensive 3-day gym-based training program designed to build strong, powerful legs and shapely glutes. This program utilizes gym equipment including barbells, dumbbells, and machines to maximize muscle development through progressive overload. Perfect for intermediate lifters looking to develop lower body strength and hypertrophy.',
    'Intermediate',
    3,
    ARRAY[]::TEXT[],
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO program_id;

  -- Step 2: Create Day 1 Template - Glutes & Quads Focus
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 1 - Glutes & Quads',
    'Heavy compound movements targeting glutes and quadriceps with hip thrusts, squats, and leg press',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day1_template_id;

  -- Step 3: Create Day 2 Template - Legs & Glutes Power
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 2 - Legs & Glutes Power',
    'High-volume leg training with squats, lunges, and leg extensions for complete lower body development',
    'Hypertrophy',
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
    'Posterior chain development with deadlifts, Romanian deadlifts, and glute isolation exercises',
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
    (program_id, 1, 'Day 1 - Glutes & Quads', day1_template_id, NOW()),
    (program_id, 2, 'Day 2 - Legs & Glutes Power', day2_template_id, NOW()),
    (program_id, 3, 'Day 3 - Hamstrings & Glutes', day3_template_id, NOW());

  -- Step 6: Insert Day 1 Exercises - Glutes & Quads (7 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 1, 4, '8-10', NULL, 120 FROM exercises WHERE name = 'Barbell Hip Thrust' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 2, 4, '8-10', NULL, 120 FROM exercises WHERE name = 'Barbell Full Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 3, 4, '12-15', NULL, 90 FROM exercises WHERE name = 'Leg Press' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 4, 3, '10-12', NULL, 90 FROM exercises WHERE name = 'Barbell Step Ups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 5, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Leg Extensions' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 6, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Barbell Glute Bridge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 7, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Calf Press On The Leg Press Machine' LIMIT 1;

  -- Step 7: Insert Day 2 Exercises - Legs & Glutes Power (6 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 1, 4, '6-8', NULL, 150 FROM exercises WHERE name = 'Barbell Full Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 2, 4, '10-12', NULL, 90 FROM exercises WHERE name = 'Barbell Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 3, 4, '12-15', NULL, 90 FROM exercises WHERE name = 'Leg Press' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 4, 3, '10-12', NULL, 60 FROM exercises WHERE name = 'Split Squat with Dumbbells' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 5, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Leg Extensions' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 6, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Goblet Squat' LIMIT 1;

  -- Step 8: Insert Day 3 Exercises - Hamstrings & Glutes (7 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 1, 4, '5-6', NULL, 180 FROM exercises WHERE name = 'Barbell Deadlift' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 2, 4, '8-10', NULL, 120 FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 3, 4, '10-12', NULL, 90 FROM exercises WHERE name = 'Barbell Hip Thrust' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 4, 4, '12-15', NULL, 60 FROM exercises WHERE name = 'Lying Leg Curls' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 5, 3, '12-15', NULL, 60 FROM exercises WHERE name = 'Dumbbell Step Ups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 6, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Glute Kickback' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 7, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Donkey Calf Raises' LIMIT 1;

  RAISE NOTICE 'FREE Pro Program "Legs & Glutes: Gym edition" created successfully! Program ID: %', program_id;
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
  pp.free_plan,
  ppd.day_number,
  ppd.name as day_name,
  wt.name as template_name,
  COUNT(te.id) as exercise_count
FROM pro_programs pp
JOIN pro_program_days ppd ON pp.id = ppd.pro_program_id
LEFT JOIN workout_templates wt ON ppd.template_id = wt.id
LEFT JOIN template_exercises te ON wt.id = te.template_id
WHERE pp.title = 'Legs & Glutes: Gym edition'
GROUP BY pp.id, pp.title, pp.description, pp.level, pp.days_per_week, pp.free_plan, ppd.day_number, ppd.name, wt.name
ORDER BY ppd.day_number;

-- Detailed Exercise List Query - Run this to see all exercises in the program
SELECT 
  pp.title as program_title,
  pp.free_plan,
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
WHERE pp.title = 'Legs & Glutes: Gym edition'
ORDER BY ppd.day_number, te.exercise_order;
