/*
  # Create Conversions Tracking Table

  1. New Table
    - `conversions`
      - `id` (uuid, primary key)
      - `user_id` (text, not null)
      - `action` (text, not null) - 'accept' or 'recheck'
      - `journey_type` (text, not null) - type of journey/flow
      - `offer_id` (text, nullable)
      - `amount` (numeric, nullable)
      - `combination` (text, nullable)
      - `duration` (text, nullable)
      - `metadata` (jsonb, default '{}')
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on conversions table
    - Users can insert their own conversion records
    - Users can view their own conversion records
*/

CREATE TABLE IF NOT EXISTS conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL,
  journey_type text NOT NULL,
  offer_id text,
  amount numeric,
  combination text,
  duration text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);

ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own conversions"
  ON conversions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own conversions"
  ON conversions FOR SELECT
  TO anon, authenticated
  USING (true);
