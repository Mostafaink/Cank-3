/*
  # Create Journey and Conversion Tracking Tables

  1. New Tables
    - `page_visits`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Who visited
      - `page` (text) - Which page: "account", "cards", "collect", "credit", "check"
      - `session_id` (uuid) - Group visits in same session
      - `visited_at` (timestamptz) - When
    
    - `conversions`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Who converted
      - `conversion_type` (text) - "accept" or "recheck"
      - `target` (text) - What they acted on
      - `offer_details` (jsonb) - Full context (amount, combination, schedule)
      - `session_id` (uuid) - Link to their journey
      - `converted_at` (timestamptz) - When

  2. Security
    - Enable RLS on both tables
    - Allow anonymous inserts for tracking
    - Allow anonymous reads for analytics

  3. Notes
    - Separates navigation from business actions
    - session_id links journeys to conversions
    - Easy queries: "Show path before accept" or "Conversion rate by page"
*/

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  session_id uuid NOT NULL,
  visited_at timestamptz DEFAULT now()
);

-- Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversion_type text NOT NULL CHECK (conversion_type IN ('accept', 'recheck')),
  target text NOT NULL,
  offer_details jsonb DEFAULT '{}'::jsonb,
  session_id uuid NOT NULL,
  converted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Policies for page_visits
CREATE POLICY "Anyone can insert page visits"
  ON page_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view page visits"
  ON page_visits
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for conversions
CREATE POLICY "Anyone can insert conversions"
  ON conversions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view conversions"
  ON conversions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS page_visits_user_id_idx ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS page_visits_session_id_idx ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS page_visits_page_idx ON page_visits(page);
CREATE INDEX IF NOT EXISTS page_visits_visited_at_idx ON page_visits(visited_at DESC);

CREATE INDEX IF NOT EXISTS conversions_user_id_idx ON conversions(user_id);
CREATE INDEX IF NOT EXISTS conversions_session_id_idx ON conversions(session_id);
CREATE INDEX IF NOT EXISTS conversions_type_idx ON conversions(conversion_type);
CREATE INDEX IF NOT EXISTS conversions_converted_at_idx ON conversions(converted_at DESC);
