/*
  # Add DELETE policy and reset offers

  1. Changes
    - Add DELETE policy for offers table
    - Reset all accepted offers back to available status
    - This allows admin to delete offers and users to see fresh offers

  2. Security
    - Policy allows deletion of offers
*/

DROP POLICY IF EXISTS "Users can delete offers" ON offers;

CREATE POLICY "Users can delete offers"
  ON offers
  FOR DELETE
  TO anon, authenticated
  USING (true);

UPDATE offers SET status = 'available', accepted_at = NULL WHERE status = 'accepted';
