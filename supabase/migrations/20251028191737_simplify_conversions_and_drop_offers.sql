/*
  # Simplify conversions table and drop offers

  1. Changes
    - Drop offers table entirely
    - Simplify conversions to track only clicks (no amounts)
    - Amounts will be tracked separately when receivables/cash are added

  2. New Structure
    - conversions: tracks user clicks/actions only
    - Future table will merge analytics + amounts + combinations
*/

-- Drop offers table
DROP TABLE IF EXISTS offers CASCADE;

-- Drop existing conversions table
DROP TABLE IF EXISTS conversions CASCADE;

-- Create simplified conversions table (clicks only)
CREATE TABLE conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'click', 'view', etc
  metadata jsonb DEFAULT '{}', -- flexible data storage
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversions"
  ON conversions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions"
  ON conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_conversions_user_created ON conversions(user_id, created_at DESC);
