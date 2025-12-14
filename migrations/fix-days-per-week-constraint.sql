-- Fix days_per_week constraint to allow 2 days
-- The current constraint requires 3-5 days, but you want 2 days
-- Run this BEFORE creating the pro program if you want to allow 2 days

-- Drop the existing constraint
ALTER TABLE pro_programs
DROP CONSTRAINT IF EXISTS pro_programs_days_per_week_check;

-- Add new constraint allowing 2-5 days
ALTER TABLE pro_programs
ADD CONSTRAINT pro_programs_days_per_week_check 
CHECK (days_per_week >= 2 AND days_per_week <= 5);

