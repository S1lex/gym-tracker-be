-- Reset and Create Pro Program with Templates
-- This script:
-- 1. Deletes all existing pro programs (cascade will delete days automatically)
-- 2. Creates a new pro program with 2 days, each referencing a template
--
-- Template IDs:
-- - Day 1: 056f0095-7f14-422c-800d-7777e747167e
-- - Day 2: ee758070-ed39-4268-bacc-2eec84eebe06

-- Step 1: Fix constraint to allow 2 days per week (if needed)
-- The default constraint requires 3-5 days, but we want 2 days
ALTER TABLE pro_programs
DROP CONSTRAINT IF EXISTS pro_programs_days_per_week_check;

ALTER TABLE pro_programs
ADD CONSTRAINT pro_programs_days_per_week_check 
CHECK (days_per_week >= 2 AND days_per_week <= 5);

-- Step 2: Delete all existing pro programs (cascade will delete days automatically)
-- WARNING: This will delete ALL pro programs and their days!
DELETE FROM pro_programs;

-- Step 3: Get template names for reference (optional - just to verify templates exist)
SELECT 
  id,
  name,
  description,
  training_type
FROM workout_templates
WHERE id IN (
  '056f0095-7f14-422c-800d-7777e747167e'::UUID,
  'ee758070-ed39-4268-bacc-2eec84eebe06'::UUID
);

-- Step 4: Create a new pro program
-- Note: You can customize title, description, level, and images
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
  2, -- 2 days per week
  ARRAY[]::TEXT[], -- Empty array, you can add image URLs if needed
  NOW(),
  NOW()
)
RETURNING id;

-- Step 5: Create days for the program (using CTE approach)
-- Replace 'PROGRAM_ID_HERE' with the ID returned from Step 3
-- Or use the following approach with a CTE (Common Table Expression):

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
    2,
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

-- Step 6: Verify the created program and days
SELECT 
  pp.id as program_id,
  pp.title,
  pp.level,
  pp.days_per_week,
  ppd.day_number,
  ppd.name as day_name,
  ppd.template_id,
  wt.name as template_name
FROM pro_programs pp
JOIN pro_program_days ppd ON pp.id = ppd.pro_program_id
LEFT JOIN workout_templates wt ON ppd.template_id = wt.id
ORDER BY pp.created_at DESC, ppd.day_number;

