/*
  # Recreate Offers Table

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - 'cash' or 'receivables'
      - `status` (text) - 'available' or 'accepted'
      - `amount` (numeric) - offer amount
      - `config` (jsonb) - combinations, schedules, enabled counts
      - `created_at` (timestamptz)
      - `accepted_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `offers` table
    - Add policies for authenticated users to read/insert/update/delete their own offers
*/

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,
  status text DEFAULT 'available',
  amount numeric DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON offers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
