/*
  # Add INSERT policy to offers table

  1. Changes
    - Add policy to allow inserting offers
    - This enables the admin panel to create new offers

  2. Security
    - Policy allows anon and authenticated users to insert offers
*/

DROP POLICY IF EXISTS "Users can insert offers" ON offers;

CREATE POLICY "Users can insert offers"
  ON offers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
