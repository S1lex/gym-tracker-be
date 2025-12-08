-- Body Measurements Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Body Measurements Table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
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
    'left_thigh',
    'right_thigh',
    'left_calf',
    'right_calf'
  )),
  value DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'lbs', 'cm', 'in', '%')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(date DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_type ON body_measurements(type);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_type_date ON body_measurements(user_id, type, date DESC);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_body_measurements_updated_at BEFORE UPDATE ON body_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Body Measurements Policies
CREATE POLICY "Users can view their own body measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body measurements"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body measurements"
  ON body_measurements FOR DELETE
  USING (auth.uid() = user_id);
