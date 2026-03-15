/*
  # Create Offers System

  1. New Tables
    - `offer_templates`
      - `id` (uuid, primary key)
      - `name` (text) - e.g., "Cash Offer", "Receivables Offer"
      - `type` (text) - 'cash' or 'receivables'
      - `amount` (numeric) - the offer amount in EGP
      - `combinations` (jsonb) - array of card combinations
      - `schedules` (jsonb) - array of available schedules
      - `enabled_count` (integer) - how many combinations are unlocked by default
      - `schedule_enabled_count` (integer) - how many schedules unlocked by default
      - `active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_offers`
      - `id` (uuid, primary key)
      - `user_id` (text, not null)
      - `offer_template_id` (uuid, references offer_templates)
      - `status` (text) - 'available', 'accepted', 'expired'
      - `custom_amount` (numeric, nullable) - override the template amount
      - `custom_combinations` (jsonb, nullable) - override combinations
      - `created_at` (timestamptz)
      - `accepted_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on both tables
    - Anyone can read active offer templates
    - Users can only view their own user_offers
*/

CREATE TABLE IF NOT EXISTS offer_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'receivables')),
  amount numeric NOT NULL DEFAULT 0,
  combinations jsonb DEFAULT '[]'::jsonb,
  schedules jsonb DEFAULT '["daily", "weekly", "monthly"]'::jsonb,
  enabled_count integer DEFAULT 1,
  schedule_enabled_count integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  offer_template_id uuid NOT NULL REFERENCES offer_templates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'expired')),
  custom_amount numeric,
  custom_combinations jsonb,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_offers_user_id ON user_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_offers_status ON user_offers(status);

ALTER TABLE offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offer templates"
  ON offer_templates FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Users can view own offers"
  ON user_offers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update own offers"
  ON user_offers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample offer templates
INSERT INTO offer_templates (name, type, amount, combinations, schedules, enabled_count, schedule_enabled_count)
VALUES 
  ('Cash Offer', 'cash', 75, '[]', '[]', 1, 1),
  ('Receivables Offer 1', 'receivables', 140, 
   '[{"label": "2R + 1S", "counts": {"red": 2, "sky": 1}}]', 
   '["daily", "weekly", "monthly"]', 1, 1),
  ('Receivables Offer 2', 'receivables', 100,
   '[{"label": "5R", "counts": {"red": 5}}, {"label": "2W", "counts": {"white": 2}}]',
   '["daily", "weekly", "monthly"]', 1, 1),
  ('Receivables Offer 3', 'receivables', 180,
   '[{"label": "1S + 4R", "counts": {"sky": 1, "red": 4}}, {"label": "4R + 1S", "counts": {"red": 4, "sky": 1}}, {"label": "9R", "counts": {"red": 9}}, {"label": "7R + 1W", "counts": {"red": 7, "white": 1}}, {"label": "1W + 7R", "counts": {"white": 1, "red": 7}}, {"label": "2R + 3W", "counts": {"red": 2, "white": 3}}]',
   '["daily", "weekly", "monthly"]', 1, 1);
