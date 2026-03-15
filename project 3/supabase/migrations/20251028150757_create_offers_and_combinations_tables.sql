/*
  # Create Offers and Offer Combinations Tables

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `amount` (numeric) - The offer amount in L.E.
      - `status` (text) - 'active' or 'inactive' to control visibility
      - `created_by_admin` (uuid) - Admin who created this offer
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `offer_combinations`
      - `id` (uuid, primary key)
      - `offer_id` (uuid) - Links to offers table
      - `label` (text) - Display label like "2R + 1S"
      - `red_count` (integer) - Number of red cards (20 L.E. each)
      - `white_count` (integer) - Number of white cards (30 L.E. each)
      - `sky_count` (integer) - Number of sky cards (40 L.E. each)
      - `blue_count` (integer) - Number of blue cards (50 L.E. each)
      - `black_count` (integer) - Number of black cards (60 L.E. each)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view active offers
    - Only authenticated users can view offers
    - Admin operations will be handled separately

  3. Important Notes
    - Multiple combinations can exist for the same offer
    - Offers can be turned on/off via status field
    - Card counts default to 0 for easier querying
*/

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by_admin uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create offer_combinations table
CREATE TABLE IF NOT EXISTS offer_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  label text NOT NULL,
  red_count integer DEFAULT 0 NOT NULL,
  white_count integer DEFAULT 0 NOT NULL,
  sky_count integer DEFAULT 0 NOT NULL,
  blue_count integer DEFAULT 0 NOT NULL,
  black_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_combinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offers
CREATE POLICY "Authenticated users can view active offers"
  ON offers FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS Policies for offer_combinations
CREATE POLICY "Authenticated users can view combinations of active offers"
  ON offer_combinations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = offer_combinations.offer_id
      AND offers.status = 'active'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_offer_combinations_offer_id ON offer_combinations(offer_id);
