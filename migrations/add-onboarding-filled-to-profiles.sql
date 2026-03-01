-- Add onboarding_filled boolean to profiles
-- New users default to false; set to true when user completes onboarding

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_filled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.onboarding_filled IS 'True when user has completed onboarding; false for new users';

-- Backfill: set onboarding_filled = true for existing users who have onboarding_completed_at
UPDATE profiles
SET onboarding_filled = true
WHERE onboarding_completed_at IS NOT NULL AND (onboarding_filled IS NULL OR onboarding_filled = false);
