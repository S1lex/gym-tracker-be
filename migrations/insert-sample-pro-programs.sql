-- Insert Sample Pro Programs
-- This script creates 2 example pro programs with 4 training days each
-- Each day has 4-6 exercises
-- Run this after creating the pro_programs tables

-- PROGRAM 1: Powerbuilding 101 (4 days per week)
INSERT INTO pro_programs (title, description, level, days_per_week, images)
VALUES (
  'Powerbuilding 101',
  'A comprehensive program combining strength and hypertrophy training for intermediate lifters. Perfect for those looking to build both strength and muscle mass.',
  'Intermediate',
  4,
  ARRAY['https://images.pexels.com/photos/416475/pexels-photo-416475.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/416474/pexels-photo-416474.jpeg?auto=compress&cs=tinysrgb&w=800']
);

-- Get the program ID (assuming it's the last inserted)
-- Day 1: Upper Power
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 1, 'Day 1: Upper Power'
FROM pro_programs
WHERE title = 'Powerbuilding 101'
ORDER BY created_at DESC
LIMIT 1;

-- Day 1 Exercises (5 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Bench Press' THEN 1
    WHEN 'Barbell Row' THEN 2
    WHEN 'Overhead Press' THEN 3
    WHEN 'Bicep Curl' THEN 4
    WHEN 'Tricep Extension' THEN 5
  END,
  CASE e.name
    WHEN 'Bench Press' THEN 4
    WHEN 'Barbell Row' THEN 4
    WHEN 'Overhead Press' THEN 3
    WHEN 'Bicep Curl' THEN 3
    WHEN 'Tricep Extension' THEN 3
  END,
  CASE e.name
    WHEN 'Bench Press' THEN '5'
    WHEN 'Barbell Row' THEN '5'
    WHEN 'Overhead Press' THEN '6'
    WHEN 'Bicep Curl' THEN '8'
    WHEN 'Tricep Extension' THEN '8'
  END,
  NULL,
  CASE e.name
    WHEN 'Bench Press' THEN 180
    WHEN 'Barbell Row' THEN 180
    WHEN 'Overhead Press' THEN 120
    WHEN 'Bicep Curl' THEN 90
    WHEN 'Tricep Extension' THEN 90
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = 'Powerbuilding 101'
  AND pd.day_number = 1
  AND e.name IN ('Bench Press', 'Barbell Row', 'Overhead Press', 'Bicep Curl', 'Tricep Extension');

-- Day 2: Lower Power
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 2, 'Day 2: Lower Power'
FROM pro_programs
WHERE title = 'Powerbuilding 101'
ORDER BY created_at DESC
LIMIT 1;

-- Day 2 Exercises (4 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Squat' THEN 1
    WHEN 'Deadlift' THEN 2
    WHEN 'Leg Press' THEN 3
    WHEN 'Calf Raise' THEN 4
  END,
  CASE e.name
    WHEN 'Squat' THEN 4
    WHEN 'Deadlift' THEN 3
    WHEN 'Leg Press' THEN 3
    WHEN 'Calf Raise' THEN 4
  END,
  CASE e.name
    WHEN 'Squat' THEN '5'
    WHEN 'Deadlift' THEN '5'
    WHEN 'Leg Press' THEN '10'
    WHEN 'Calf Raise' THEN '12'
  END,
  NULL,
  CASE e.name
    WHEN 'Squat' THEN 180
    WHEN 'Deadlift' THEN 240
    WHEN 'Leg Press' THEN 120
    WHEN 'Calf Raise' THEN 90
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = 'Powerbuilding 101'
  AND pd.day_number = 2
  AND e.name IN ('Squat', 'Deadlift', 'Leg Press', 'Calf Raise');

-- Day 3: Upper Hypertrophy
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 3, 'Day 3: Upper Hypertrophy'
FROM pro_programs
WHERE title = 'Powerbuilding 101'
ORDER BY created_at DESC
LIMIT 1;

-- Day 3 Exercises (6 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Bench Press' THEN 1
    WHEN 'Barbell Row' THEN 2
    WHEN 'Overhead Press' THEN 3
    WHEN 'Bicep Curl' THEN 4
    WHEN 'Tricep Extension' THEN 5
    WHEN 'Pull-up' THEN 6
  END,
  CASE e.name
    WHEN 'Bench Press' THEN 4
    WHEN 'Barbell Row' THEN 4
    WHEN 'Overhead Press' THEN 3
    WHEN 'Bicep Curl' THEN 3
    WHEN 'Tricep Extension' THEN 3
    WHEN 'Pull-up' THEN 3
  END,
  CASE e.name
    WHEN 'Bench Press' THEN '8-10'
    WHEN 'Barbell Row' THEN '8-10'
    WHEN 'Overhead Press' THEN '10'
    WHEN 'Bicep Curl' THEN '12'
    WHEN 'Tricep Extension' THEN '12'
    WHEN 'Pull-up' THEN '10'
  END,
  NULL,
  CASE e.name
    WHEN 'Bench Press' THEN 120
    WHEN 'Barbell Row' THEN 120
    WHEN 'Overhead Press' THEN 90
    WHEN 'Bicep Curl' THEN 60
    WHEN 'Tricep Extension' THEN 60
    WHEN 'Pull-up' THEN 90
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = 'Powerbuilding 101'
  AND pd.day_number = 3
  AND e.name IN ('Bench Press', 'Barbell Row', 'Overhead Press', 'Bicep Curl', 'Tricep Extension', 'Pull-up');

-- Day 4: Lower Hypertrophy
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 4, 'Day 4: Lower Hypertrophy'
FROM pro_programs
WHERE title = 'Powerbuilding 101'
ORDER BY created_at DESC
LIMIT 1;

-- Day 4 Exercises (4 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Squat' THEN 1
    WHEN 'Leg Press' THEN 2
    WHEN 'Deadlift' THEN 3
    WHEN 'Calf Raise' THEN 4
  END,
  CASE e.name
    WHEN 'Squat' THEN 4
    WHEN 'Leg Press' THEN 4
    WHEN 'Deadlift' THEN 3
    WHEN 'Calf Raise' THEN 4
  END,
  CASE e.name
    WHEN 'Squat' THEN '8-10'
    WHEN 'Leg Press' THEN '12'
    WHEN 'Deadlift' THEN '8'
    WHEN 'Calf Raise' THEN '15'
  END,
  NULL,
  CASE e.name
    WHEN 'Squat' THEN 120
    WHEN 'Leg Press' THEN 90
    WHEN 'Deadlift' THEN 180
    WHEN 'Calf Raise' THEN 60
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = 'Powerbuilding 101'
  AND pd.day_number = 4
  AND e.name IN ('Squat', 'Leg Press', 'Deadlift', 'Calf Raise');

-- PROGRAM 2: 5/3/1 Strength (4 days per week)
INSERT INTO pro_programs (title, description, level, days_per_week, images)
VALUES (
  '5/3/1 Strength',
  'Jim Wendler''s proven strength program focusing on the big four lifts. Designed for intermediate to advanced lifters who want to build maximum strength.',
  'Intermediate',
  4,
  ARRAY['https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1547248/pexels-photo-1547248.jpeg?auto=compress&cs=tinysrgb&w=800']
);

-- Day 1: Bench Press Focus
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 1, 'Week 1 - Day 1: Bench Press'
FROM pro_programs
WHERE title = '5/3/1 Strength'
ORDER BY created_at DESC
LIMIT 1;

-- Day 1 Exercises (4 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Bench Press' THEN 1
    WHEN 'Barbell Row' THEN 2
    WHEN 'Tricep Extension' THEN 3
    WHEN 'Bicep Curl' THEN 4
  END,
  CASE e.name
    WHEN 'Bench Press' THEN 3
    WHEN 'Barbell Row' THEN 5
    WHEN 'Tricep Extension' THEN 5
    WHEN 'Bicep Curl' THEN 3
  END,
  CASE e.name
    WHEN 'Bench Press' THEN '5'
    WHEN 'Barbell Row' THEN '10'
    WHEN 'Tricep Extension' THEN '10'
    WHEN 'Bicep Curl' THEN '12'
  END,
  NULL,
  CASE e.name
    WHEN 'Bench Press' THEN 180
    WHEN 'Barbell Row' THEN 120
    WHEN 'Tricep Extension' THEN 90
    WHEN 'Bicep Curl' THEN 60
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = '5/3/1 Strength'
  AND pd.day_number = 1
  AND e.name IN ('Bench Press', 'Barbell Row', 'Tricep Extension', 'Bicep Curl');

-- Day 2: Squat Focus
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 2, 'Week 1 - Day 2: Squat'
FROM pro_programs
WHERE title = '5/3/1 Strength'
ORDER BY created_at DESC
LIMIT 1;

-- Day 2 Exercises (4 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Squat' THEN 1
    WHEN 'Leg Press' THEN 2
    WHEN 'Calf Raise' THEN 3
    WHEN 'Deadlift' THEN 4
  END,
  CASE e.name
    WHEN 'Squat' THEN 3
    WHEN 'Leg Press' THEN 5
    WHEN 'Calf Raise' THEN 5
    WHEN 'Deadlift' THEN 3
  END,
  CASE e.name
    WHEN 'Squat' THEN '5'
    WHEN 'Leg Press' THEN '10'
    WHEN 'Calf Raise' THEN '15'
    WHEN 'Deadlift' THEN '8'
  END,
  NULL,
  CASE e.name
    WHEN 'Squat' THEN 180
    WHEN 'Leg Press' THEN 120
    WHEN 'Calf Raise' THEN 90
    WHEN 'Deadlift' THEN 180
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = '5/3/1 Strength'
  AND pd.day_number = 2
  AND e.name IN ('Squat', 'Leg Press', 'Calf Raise', 'Deadlift');

-- Day 3: Overhead Press Focus
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 3, 'Week 1 - Day 3: Overhead Press'
FROM pro_programs
WHERE title = '5/3/1 Strength'
ORDER BY created_at DESC
LIMIT 1;

-- Day 3 Exercises (5 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Overhead Press' THEN 1
    WHEN 'Bench Press' THEN 2
    WHEN 'Barbell Row' THEN 3
    WHEN 'Tricep Extension' THEN 4
    WHEN 'Bicep Curl' THEN 5
  END,
  CASE e.name
    WHEN 'Overhead Press' THEN 3
    WHEN 'Bench Press' THEN 5
    WHEN 'Barbell Row' THEN 5
    WHEN 'Tricep Extension' THEN 3
    WHEN 'Bicep Curl' THEN 3
  END,
  CASE e.name
    WHEN 'Overhead Press' THEN '5'
    WHEN 'Bench Press' THEN '10'
    WHEN 'Barbell Row' THEN '10'
    WHEN 'Tricep Extension' THEN '12'
    WHEN 'Bicep Curl' THEN '12'
  END,
  NULL,
  CASE e.name
    WHEN 'Overhead Press' THEN 180
    WHEN 'Bench Press' THEN 120
    WHEN 'Barbell Row' THEN 120
    WHEN 'Tricep Extension' THEN 90
    WHEN 'Bicep Curl' THEN 60
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = '5/3/1 Strength'
  AND pd.day_number = 3
  AND e.name IN ('Overhead Press', 'Bench Press', 'Barbell Row', 'Tricep Extension', 'Bicep Curl');

-- Day 4: Deadlift Focus
INSERT INTO pro_program_days (pro_program_id, day_number, name)
SELECT id, 4, 'Week 1 - Day 4: Deadlift'
FROM pro_programs
WHERE title = '5/3/1 Strength'
ORDER BY created_at DESC
LIMIT 1;

-- Day 4 Exercises (5 exercises)
INSERT INTO pro_program_day_exercises (pro_program_day_id, exercise_id, exercise_order, sets, reps, weight, rest_seconds)
SELECT 
  pd.id,
  e.id,
  CASE e.name
    WHEN 'Deadlift' THEN 1
    WHEN 'Barbell Row' THEN 2
    WHEN 'Pull-up' THEN 3
    WHEN 'Bicep Curl' THEN 4
    WHEN 'Calf Raise' THEN 5
  END,
  CASE e.name
    WHEN 'Deadlift' THEN 1
    WHEN 'Barbell Row' THEN 5
    WHEN 'Pull-up' THEN 5
    WHEN 'Bicep Curl' THEN 3
    WHEN 'Calf Raise' THEN 4
  END,
  CASE e.name
    WHEN 'Deadlift' THEN '5'
    WHEN 'Barbell Row' THEN '10'
    WHEN 'Pull-up' THEN '10'
    WHEN 'Bicep Curl' THEN '12'
    WHEN 'Calf Raise' THEN '15'
  END,
  NULL,
  CASE e.name
    WHEN 'Deadlift' THEN 240
    WHEN 'Barbell Row' THEN 120
    WHEN 'Pull-up' THEN 120
    WHEN 'Bicep Curl' THEN 60
    WHEN 'Calf Raise' THEN 90
  END
FROM pro_program_days pd
JOIN pro_programs p ON pd.pro_program_id = p.id
CROSS JOIN exercises e
WHERE p.title = '5/3/1 Strength'
  AND pd.day_number = 4
  AND e.name IN ('Deadlift', 'Barbell Row', 'Pull-up', 'Bicep Curl', 'Calf Raise');
