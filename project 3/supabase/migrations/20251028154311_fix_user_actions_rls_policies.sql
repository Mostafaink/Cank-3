/*
  # Fix User Actions RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add policy to allow anyone (anon) to insert actions
    - Add policy to allow anyone (anon) to view actions
  
  2. Notes
    - This allows tracking without authentication
    - Suitable for analytics and click tracking
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own actions" ON user_actions;
DROP POLICY IF EXISTS "Users can view own actions" ON user_actions;

-- Allow anyone to insert actions (for tracking)
CREATE POLICY "Anyone can insert actions"
  ON user_actions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view actions (for analytics)
CREATE POLICY "Anyone can view actions"
  ON user_actions
  FOR SELECT
  TO anon, authenticated
  USING (true);
