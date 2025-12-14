-- Assign Template IDs to Pro Program Days
-- This script assigns the provided template IDs to pro program days

-- Template IDs to assign:
-- 056f0095-7f14-422c-800d-7777e747167e
-- ee758070-ed39-4268-bacc-2eec84eebe06

-- Option 1: Assign to specific days by name pattern
-- Update Day 1 of each program (if exists)
UPDATE pro_program_days
SET template_id = '056f0095-7f14-422c-800d-7777e747167e'::UUID
WHERE day_number = 1 
  AND template_id IS NULL
  AND id IN (
    SELECT id FROM pro_program_days 
    WHERE day_number = 1 
    ORDER BY created_at 
    LIMIT 1
  );

-- Update Day 2 of each program (if exists)
UPDATE pro_program_days
SET template_id = 'ee758070-ed39-4268-bacc-2eec84eebe06'::UUID
WHERE day_number = 2 
  AND template_id IS NULL
  AND id IN (
    SELECT id FROM pro_program_days 
    WHERE day_number = 2 
    ORDER BY created_at 
    LIMIT 1
  );

-- Option 2: If you want to assign to specific program days by program name
-- Uncomment and modify the following if you know the program names:

-- UPDATE pro_program_days
-- SET template_id = '056f0095-7f14-422c-800d-7777e747167e'::UUID
-- WHERE id IN (
--   SELECT ppd.id 
--   FROM pro_program_days ppd
--   JOIN pro_programs pp ON ppd.pro_program_id = pp.id
--   WHERE pp.title = 'Powerbuilding 101' 
--     AND ppd.day_number = 1
--     AND ppd.template_id IS NULL
-- );

-- UPDATE pro_program_days
-- SET template_id = 'ee758070-ed39-4268-bacc-2eec84eebe06'::UUID
-- WHERE id IN (
--   SELECT ppd.id 
--   FROM pro_program_days ppd
--   JOIN pro_programs pp ON ppd.pro_program_id = pp.id
--   WHERE pp.title = 'Powerbuilding 101' 
--     AND ppd.day_number = 2
--     AND ppd.template_id IS NULL
-- );

-- Verify the assignments
SELECT 
  pp.title as program_name,
  ppd.day_number,
  ppd.name as day_name,
  ppd.template_id,
  wt.name as template_name
FROM pro_program_days ppd
JOIN pro_programs pp ON ppd.pro_program_id = pp.id
LEFT JOIN workout_templates wt ON ppd.template_id = wt.id
WHERE ppd.template_id IN (
  '056f0095-7f14-422c-800d-7777e747167e'::UUID,
  'ee758070-ed39-4268-bacc-2eec84eebe06'::UUID
)
ORDER BY pp.title, ppd.day_number;

