/*
  # Simplify Offers System

  1. Changes
    - Drop complex offer_templates and user_offers tables
    - Create single simple offers table
  
  2. New Table: offers
    - `id` (uuid, primary key)
    - `user_id` (text) - which user this offer is for
    - `type` (text) - 'cash', 'receivables', 'unlock_combination', 'unlock_schedule'
    - `status` (text) - 'available', 'accepted'
    - `amount` (numeric) - the amount of money (if applicable)
    - `config` (jsonb) - any additional configuration (combinations, schedules, etc)
    - `created_at` (timestamptz)
    - `accepted_at` (timestamptz)
*/

DROP TABLE IF EXISTS user_offers CASCADE;
DROP TABLE IF EXISTS offer_templates CASCADE;

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'accepted')),
  amount numeric DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_offers_user_id ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_type ON offers(type);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offers"
  ON offers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update own offers"
  ON offers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample offers for demo user
INSERT INTO offers (user_id, type, status, amount, config) VALUES
  -- Cash offer with amount = 2
  ('00000000-0000-0000-0000-000000000001', 'cash', 'available', 2, '{}'),
  
  -- Receivables offers
  ('00000000-0000-0000-0000-000000000001', 'receivables', 'available', 140, 
   '{"combinations": [{"label": "2R + 1S", "counts": {"red": 2, "sky": 1}}], "schedules": ["daily", "weekly", "monthly"], "enabled_count": 1, "schedule_enabled_count": 1}'),
  
  ('00000000-0000-0000-0000-000000000001', 'receivables', 'available', 100,
   '{"combinations": [{"label": "5R", "counts": {"red": 5}}, {"label": "2W", "counts": {"white": 2}}], "schedules": ["daily", "weekly", "monthly"], "enabled_count": 1, "schedule_enabled_count": 1}'),
  
  ('00000000-0000-0000-0000-000000000001', 'receivables', 'available', 180,
   '{"combinations": [{"label": "1S + 4R", "counts": {"sky": 1, "red": 4}}, {"label": "4R + 1S", "counts": {"red": 4, "sky": 1}}, {"label": "9R", "counts": {"red": 9}}, {"label": "7R + 1W", "counts": {"red": 7, "white": 1}}, {"label": "1W + 7R", "counts": {"white": 1, "red": 7}}, {"label": "2R + 3W", "counts": {"red": 2, "white": 3}}], "schedules": ["daily", "weekly", "monthly"], "enabled_count": 1, "schedule_enabled_count": 1}');
