-- Add 'glutes' measurement type to body_measurements table
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing CHECK constraint
ALTER TABLE body_measurements DROP CONSTRAINT IF EXISTS body_measurements_type_check;

-- Add the new CHECK constraint with 'glutes' included
ALTER TABLE body_measurements ADD CONSTRAINT body_measurements_type_check 
  CHECK (type IN (
    'weight',
    'body_fat_percentage',
    'neck',
    'shoulders',
    'chest',
    'left_bicep',
    'right_bicep',
    'left_forearm',
    'right_forearm',
    'waist',
    'hips',
    'glutes',
    'left_thigh',
    'right_thigh',
    'left_calf',
    'right_calf'
  ));

