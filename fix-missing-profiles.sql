-- Fix Missing Profiles for Existing Users
-- Run this SQL in your Supabase SQL Editor to create profiles for users who don't have one

-- Create profiles for all auth.users who don't have a profile yet
-- Uses email prefix as username, or generates a username from user ID
INSERT INTO profiles (id, username)
SELECT 
  id,
  CASE 
    WHEN email IS NOT NULL AND email != '' THEN
      split_part(email, '@', 1)
    ELSE
      'user_' || substring(id::text from 1 for 8)
  END as username
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;


