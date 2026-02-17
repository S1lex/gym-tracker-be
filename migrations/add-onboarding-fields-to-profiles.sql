-- Add onboarding fields to profiles table
-- This migration adds user onboarding/preferences data to the profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS current_weight_unit TEXT CHECK (current_weight_unit IN ('kg', 'lbs')),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS target_weight_unit TEXT CHECK (target_weight_unit IN ('kg', 'lbs')),
ADD COLUMN IF NOT EXISTS problem_zones TEXT[], -- Array of problem zone IDs
ADD COLUMN IF NOT EXISTS training_preference TEXT CHECK (training_preference IN ('gym', 'home')),
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the fields
COMMENT ON COLUMN profiles.gender IS 'User gender: male, female, or other';
COMMENT ON COLUMN profiles.current_weight IS 'User current weight';
COMMENT ON COLUMN profiles.current_weight_unit IS 'Unit for current weight: kg or lbs';
COMMENT ON COLUMN profiles.target_weight IS 'User target weight goal';
COMMENT ON COLUMN profiles.target_weight_unit IS 'Unit for target weight: kg or lbs';
COMMENT ON COLUMN profiles.problem_zones IS 'Array of body areas user wants to focus on';
COMMENT ON COLUMN profiles.training_preference IS 'Preferred training location: gym or home';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when user completed onboarding';
