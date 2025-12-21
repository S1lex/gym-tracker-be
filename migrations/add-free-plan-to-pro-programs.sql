-- Add free_plan field to pro_programs table
-- This field indicates whether a pro program is available to free users
ALTER TABLE pro_programs 
ADD COLUMN IF NOT EXISTS free_plan BOOLEAN DEFAULT false;

-- Create index for filtering free plans
CREATE INDEX IF NOT EXISTS idx_pro_programs_free_plan ON pro_programs(free_plan);

-- Add comment
COMMENT ON COLUMN pro_programs.free_plan IS 'If true, this pro program is available to free (non-subscribed) users';
