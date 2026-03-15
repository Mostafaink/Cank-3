/*
  # Fix Profiles Table for Authentication

  ## Overview
  This migration fixes the profiles table to work properly with Supabase Auth.
  It drops and recreates the profiles and balances tables with the correct structure.

  ## Changes
  1. Drop existing profiles and balances tables and recreate with correct schema
  2. Ensure profiles.id references auth.users(id)
  3. Add email column to profiles
  4. Add role column for authorization
  5. Update balances to use correct column names
  6. Recreate trigger and RLS policies

  ## Important
  - This will reset all existing profile and balance data
  - Auth users will remain intact
  - New signups will work correctly
*/

-- Drop existing tables and policies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create new profiles table with correct structure
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create new balances table
CREATE TABLE balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  cards_balance numeric DEFAULT 0,
  collect_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_balances_user_id ON balances(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (true);

-- Balances RLS Policies
CREATE POLICY "Users can read own balances"
  ON balances
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all balances"
  ON balances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own balances"
  ON balances
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own balances"
  ON balances
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Recreate trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO balances (user_id, cards_balance, collect_balance)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create profiles and balances for any existing auth users
INSERT INTO profiles (id, email, first_name, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'first_name', email),
  COALESCE(raw_user_meta_data->>'full_name', email),
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO balances (user_id, cards_balance, collect_balance)
SELECT id, 0, 0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;