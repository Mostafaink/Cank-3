/*
  # Create User Flows Table

  1. New Tables
    - `user_flows`
      - `id` (uuid, primary key)
      - `user_id` (text, not null) - the user being tracked
      - `flow_type` (text, not null) - which flow they're assigned to (e.g., 'standard', 'high_value', 'quick_cash')
      - `current_modal_step` (integer, default 0) - which step in the flow sequence they're on
      - `last_action` (text, nullable) - last action taken ('accept' or 'recheck')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `user_flows` table
    - Add policies for reading and updating user flows
  
  3. Notes
    - Each user can have one active flow at a time
    - Admin can assign/change user flows
    - System updates current_modal_step as user progresses through modals
*/

CREATE TABLE IF NOT EXISTS user_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  flow_type text NOT NULL,
  current_modal_step integer DEFAULT 0,
  last_action text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_flows_user_id ON user_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flows_flow_type ON user_flows(flow_type);

ALTER TABLE user_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user flows"
  ON user_flows
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert user flows"
  ON user_flows
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update user flows"
  ON user_flows
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete user flows"
  ON user_flows
  FOR DELETE
  TO anon, authenticated
  USING (true);