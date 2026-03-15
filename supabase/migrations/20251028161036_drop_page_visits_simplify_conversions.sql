/*
  # Simplify Tracking - Remove page_visits, Focus on Conversions

  1. Changes
    - Drop page_visits table (not needed)
    - Keep conversions table but rename to user_conversions for clarity
    - Add offer-specific fields to link conversions to receivables
    - Remove session_id (not needed for manual data entry)

  2. Notes
    - Focused only on accept/recheck clicks
    - Direct link between click → offer → amount/duration/combination
    - Simple structure for manual data entry
*/

-- Drop page_visits table
DROP TABLE IF EXISTS page_visits CASCADE;

-- Drop existing conversions table
DROP TABLE IF EXISTS conversions CASCADE;

-- Create simplified user_conversions table
CREATE TABLE IF NOT EXISTS user_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('accept', 'recheck')),
  target text NOT NULL,
  offer_id uuid,
  amount numeric,
  combination text,
  duration text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_conversions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Anyone can insert conversions"
  ON user_conversions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view
CREATE POLICY "Anyone can view conversions"
  ON user_conversions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS user_conversions_user_id_idx ON user_conversions(user_id);
CREATE INDEX IF NOT EXISTS user_conversions_target_idx ON user_conversions(target);
CREATE INDEX IF NOT EXISTS user_conversions_offer_id_idx ON user_conversions(offer_id);
CREATE INDEX IF NOT EXISTS user_conversions_created_at_idx ON user_conversions(created_at DESC);
