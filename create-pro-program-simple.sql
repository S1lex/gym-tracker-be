-- Simple SQL to create a pro program with 2 days
-- Run this AFTER deleting existing pro programs
-- This uses a CTE (Common Table Expression) to create program and days in one query

WITH new_program AS (
  INSERT INTO pro_programs (
    title,
    description,
    level,
    days_per_week,
    images,
    created_at,
    updated_at
  ) VALUES (
    'Powerbuilding Program',
    'A comprehensive powerbuilding program combining strength and hypertrophy training',
    'Intermediate',
    2, -- Note: If constraint requires 3-5, change to 3 and add a third day or update the constraint
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  )
  RETURNING id
)
INSERT INTO pro_program_days (
  pro_program_id,
  day_number,
  name,
  template_id,
  created_at
)
SELECT 
  new_program.id,
  1,
  'Day 1 - Upper Body',
  '056f0095-7f14-422c-800d-7777e747167e'::UUID,
  NOW()
FROM new_program
UNION ALL
SELECT 
  new_program.id,
  2,
  'Day 2 - Lower Body',
  'ee758070-ed39-4268-bacc-2eec84eebe06'::UUID,
  NOW()
FROM new_program;

-- Verify the creation
SELECT 
  pp.id as program_id,
  pp.title,
  pp.level,
  pp.days_per_week,
  ppd.day_number,
  ppd.name as day_name,
  ppd.template_id,
  wt.name as template_name,
  wt.description as template_description
FROM pro_programs pp
JOIN pro_program_days ppd ON pp.id = ppd.pro_program_id
LEFT JOIN workout_templates wt ON ppd.template_id = wt.id
ORDER BY pp.created_at DESC, ppd.day_number;

