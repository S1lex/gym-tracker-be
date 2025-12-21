-- Create FREE Pro Program: Fat Loss: Intermediate
-- 7-day training program focused on fat burning and weight loss for intermediate exercisers
-- This is a FREE plan available to all users
-- Run this SQL in your Supabase SQL Editor

DO $$
DECLARE
  program_id UUID;
  day1_template_id UUID;
  day2_template_id UUID;
  day3_template_id UUID;
  day4_template_id UUID;
  day5_template_id UUID;
  day6_template_id UUID;
  day7_template_id UUID;
BEGIN
  -- Step 0: Update constraints to allow up to 7 days per week
  -- Drop existing constraint on days_per_week if it exists
  ALTER TABLE pro_programs DROP CONSTRAINT IF EXISTS pro_programs_days_per_week_check;
  
  -- Recreate constraint to allow 3-7 days per week
  ALTER TABLE pro_programs 
  ADD CONSTRAINT pro_programs_days_per_week_check 
  CHECK (days_per_week >= 3 AND days_per_week <= 7);
  
  -- Also update day_number constraint in pro_program_days if needed (allow up to 7 days)
  ALTER TABLE pro_program_days DROP CONSTRAINT IF EXISTS pro_program_days_day_number_check;
  
  ALTER TABLE pro_program_days
  ADD CONSTRAINT pro_program_days_day_number_check
  CHECK (day_number >= 1 AND day_number <= 7);

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
    'Fat Loss: Intermediate',
    'An intensive 7-day fat loss program designed for intermediate exercisers looking to maximize calorie burn and accelerate weight loss. This program combines HIIT, cardio, strength training, and metabolic conditioning to boost your metabolism, torch calories, and build lean muscle. Each day focuses on different training modalities to keep your body guessing and maximize results.',
    'Intermediate',
    7,
    ARRAY[]::TEXT[],
    true,
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
    'High-intensity interval training targeting the entire body with explosive movements for maximum calorie burn',
    'HIIT',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day1_template_id;

  -- Step 3: Create Day 2 Template - Cardio Blast
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 2 - Cardio Blast',
    'High-intensity cardiovascular training to elevate heart rate and maximize fat burning',
    'Cardio',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day2_template_id;

  -- Step 4: Create Day 3 Template - Lower Body HIIT
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 3 - Lower Body HIIT',
    'High-intensity lower body training focusing on legs and glutes with plyometric movements',
    'HIIT',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day3_template_id;

  -- Step 5: Create Day 4 Template - Core & Cardio Mix
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 4 - Core & Cardio Mix',
    'Core strengthening combined with cardio movements for total body conditioning',
    'Cardio',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day4_template_id;

  -- Step 6: Create Day 5 Template - Full Body Strength Cardio
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 5 - Full Body Strength Cardio',
    'Metabolic conditioning combining strength movements with cardiovascular elements',
    'Strength',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day5_template_id;

  -- Step 7: Create Day 6 Template - Upper Body HIIT
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 6 - Upper Body HIIT',
    'High-intensity upper body training with cardio elements for complete upper body conditioning',
    'HIIT',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day6_template_id;

  -- Step 8: Create Day 7 Template - Active Recovery & Endurance
  INSERT INTO workout_templates (
    name,
    description,
    training_type,
    is_pro_program_template,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    'Day 7 - Active Recovery & Endurance',
    'Lower intensity endurance training and active recovery to maintain calorie burn while allowing recovery',
    'Cardio',
    TRUE,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO day7_template_id;

  -- Step 9: Create Pro Program Days
  INSERT INTO pro_program_days (
    pro_program_id,
    day_number,
    name,
    template_id,
    created_at
  ) VALUES
    (program_id, 1, 'Day 1 - Full Body HIIT', day1_template_id, NOW()),
    (program_id, 2, 'Day 2 - Cardio Blast', day2_template_id, NOW()),
    (program_id, 3, 'Day 3 - Lower Body HIIT', day3_template_id, NOW()),
    (program_id, 4, 'Day 4 - Core & Cardio Mix', day4_template_id, NOW()),
    (program_id, 5, 'Day 5 - Full Body Strength Cardio', day5_template_id, NOW()),
    (program_id, 6, 'Day 6 - Upper Body HIIT', day6_template_id, NOW()),
    (program_id, 7, 'Day 7 - Active Recovery & Endurance', day7_template_id, NOW());

  -- Step 10: Insert Day 1 Exercises - Full Body HIIT (7 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 1, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 2, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 3, 4, '10-15', NULL, 30 FROM exercises WHERE name = 'Pushups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 4, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Bodyweight Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 5, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 6, 3, '20-25', NULL, 30 FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day1_template_id, id, 7, 3, '30-45', NULL, 30 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;

  -- Step 11: Insert Day 2 Exercises - Cardio Blast (6 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 1, 4, '30-45', NULL, 30 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 2, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 3, 3, '500m', NULL, 60 FROM exercises WHERE name = 'Rowing, Stationary' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 4, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 5, 3, '15-20 min', NULL, 60 FROM exercises WHERE name = 'Running, Treadmill' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day2_template_id, id, 6, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;

  -- Step 12: Insert Day 3 Exercises - Lower Body HIIT (6 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 1, 4, '20-25', NULL, 45 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 2, 4, '15-20', NULL, 60 FROM exercises WHERE name = 'Bodyweight Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 3, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Bodyweight Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 4, 3, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 5, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Butt Lift (Bridge)' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day3_template_id, id, 6, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;

  -- Step 13: Insert Day 4 Exercises - Core & Cardio Mix (5 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 1, 4, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 2, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 3, 3, '20-25', NULL, 30 FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 4, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Crunches' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day4_template_id, id, 5, 3, '30-45', NULL, 30 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;

  -- Step 14: Insert Day 5 Exercises - Full Body Strength Cardio (7 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 1, 4, '15-20', NULL, 45 FROM exercises WHERE name = 'Bodyweight Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 2, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Pushups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 3, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Bodyweight Walking Lunge' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 4, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 5, 3, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 6, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day5_template_id, id, 7, 3, '30-45', NULL, 30 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;

  -- Step 15: Insert Day 6 Exercises - Upper Body HIIT (5 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day6_template_id, id, 1, 4, '12-15', NULL, 45 FROM exercises WHERE name = 'Pushups' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day6_template_id, id, 2, 4, '20-30', NULL, 30 FROM exercises WHERE name = 'Mountain Climbers' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day6_template_id, id, 3, 3, '45-60', NULL, 30 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day6_template_id, id, 4, 3, '20-25', NULL, 30 FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day6_template_id, id, 5, 3, '15-20', NULL, 45 FROM exercises WHERE name = 'Freehand Jump Squat' LIMIT 1;

  -- Step 16: Insert Day 7 Exercises - Active Recovery & Endurance (4 exercises)
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day7_template_id, id, 1, 1, '25-30 min', NULL, 0 FROM exercises WHERE name = 'Running, Treadmill' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day7_template_id, id, 2, 2, '10-15 min', NULL, 60 FROM exercises WHERE name = 'Rope Jumping' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day7_template_id, id, 3, 3, '60-90', NULL, 45 FROM exercises WHERE name = 'Plank' LIMIT 1;
  
  INSERT INTO template_exercises (template_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
  SELECT day7_template_id, id, 4, 2, '500m', NULL, 120 FROM exercises WHERE name = 'Rowing, Stationary' LIMIT 1;

  RAISE NOTICE 'FREE Pro Program "Fat Loss: Intermediate" created successfully! Program ID: %', program_id;
  RAISE NOTICE 'Day 1 Template ID: %', day1_template_id;
  RAISE NOTICE 'Day 2 Template ID: %', day2_template_id;
  RAISE NOTICE 'Day 3 Template ID: %', day3_template_id;
  RAISE NOTICE 'Day 4 Template ID: %', day4_template_id;
  RAISE NOTICE 'Day 5 Template ID: %', day5_template_id;
  RAISE NOTICE 'Day 6 Template ID: %', day6_template_id;
  RAISE NOTICE 'Day 7 Template ID: %', day7_template_id;
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
WHERE pp.title = 'Fat Loss: Intermediate'
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
WHERE pp.title = 'Fat Loss: Intermediate'
ORDER BY ppd.day_number, te.exercise_order;
