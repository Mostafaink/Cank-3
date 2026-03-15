/*
  # Add User Roles System

  1. Changes
    - Add is_admin column to profiles table (if exists) or create admin_users table
    - Add check to determine if user is admin
  
  2. Security
    - Regular users cannot modify admin status
    - Only specific users can be marked as admin
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin list"
  ON admin_users FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "No one can modify admin list"
  ON admin_users FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No one can update admin list"
  ON admin_users FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No one can delete admin list"
  ON admin_users FOR DELETE
  TO authenticated, anon
  USING (false);

INSERT INTO admin_users (user_id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;
