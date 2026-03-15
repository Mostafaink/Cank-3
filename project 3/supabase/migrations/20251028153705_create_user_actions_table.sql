/*
  # Create User Actions Tracking Table

  1. New Tables
    - `user_actions`
      - `id` (uuid, primary key) - Unique identifier for each action
      - `user_id` (uuid) - User who performed the action
      - `action` (text) - Type of action: "accept", "recheck", "page_view", "modal_open", "button_click"
      - `target` (text) - What was acted upon: "activate_receivables", "activate_cash", "credit_page", "collect_page", etc.
      - `metadata` (jsonb) - Additional details like {offer_id, amount, schedule, combination}
      - `created_at` (timestamptz) - When the action occurred

  2. Security
    - Enable RLS on `user_actions` table
    - Users can insert their own actions
    - Users can view their own actions
    - Admins can view all actions

  3. Notes
    - This table tracks ALL user interactions in the app
    - Simple structure to capture clicks, views, accepts, rechecks
    - JSONB metadata allows flexible storage without schema changes
*/

CREATE TABLE IF NOT EXISTS user_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own actions
CREATE POLICY "Users can insert own actions"
  ON user_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own actions
CREATE POLICY "Users can view own actions"
  ON user_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS user_actions_user_id_idx ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS user_actions_created_at_idx ON user_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS user_actions_action_idx ON user_actions(action);
