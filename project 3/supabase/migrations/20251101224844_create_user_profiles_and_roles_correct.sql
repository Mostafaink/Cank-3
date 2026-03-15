/*
  # Create User Profiles and Role-Based Access Control

  ## Overview
  This migration sets up a complete authentication and authorization system using Supabase Auth.
  It creates user profiles, role management, and proper RLS policies for secure data access.

  ## 1. New Tables

  ### `profiles`
  Stores additional user profile information linked to auth.users
  - `id` (uuid, primary key) - matches auth.users.id
  - `email` (text, unique, not null) - user's email address
  - `first_name` (text, nullable) - user's first name
  - `full_name` (text, nullable) - user's full name
  - `role` (text, default 'user') - user role: 'admin', 'user'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `balances`
  Stores user balances for cards and collect
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles.id) - links to user profile
  - `cards_balance` (numeric, default 0) - balance for cards
  - `collect_balance` (numeric, default 0) - balance for collect/receivables
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ## 2. Functions

  ### `handle_new_user()`
  Trigger function that automatically creates profile and balance records when a new user signs up

  ## 3. Security

  ### Profiles Table RLS
  - Users can read their own profile
  - Users can update their own profile (except role field)
  - Admins can read all profiles
  - Admins can update any profile

  ### Balances Table RLS
  - Users can read their own balances
  - Users can update their own balances
  - Admins can read all balances

  ### Offers Table RLS Updates
  - Users can only see their own offers
  - Admins can see all offers

  ## 4. Indexes
  - Index on profiles.email for faster lookups
  - Index on profiles.role for filtering by role
  - Index on balances.user_id for user balance queries

  ## 5. Important Notes
  - Email confirmation is disabled by default in Supabase
  - Passwords must meet minimum requirements (6+ characters)
  - Role field in profiles is protected and can only be changed by admins
  - New users automatically get 'user' role
  - The system uses Supabase's built-in auth.users table
  - Profile creation is automatic via trigger when user signs up
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  cards_balance numeric DEFAULT 0,
  collect_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);

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

-- Update offers table RLS policies for proper user isolation
DROP POLICY IF EXISTS "Users can read own offers" ON offers;
DROP POLICY IF EXISTS "Users can insert own offers" ON offers;
DROP POLICY IF EXISTS "Users can update own offers" ON offers;
DROP POLICY IF EXISTS "Users can delete own offers" ON offers;
DROP POLICY IF EXISTS "Anyone can read offer templates" ON offers;
DROP POLICY IF EXISTS "Anyone can insert offer templates" ON offers;
DROP POLICY IF EXISTS "Anyone can update offer templates" ON offers;
DROP POLICY IF EXISTS "Anyone can delete offer templates" ON offers;
DROP POLICY IF EXISTS "Admins can insert offers" ON offers;
DROP POLICY IF EXISTS "Admins can update offers" ON offers;
DROP POLICY IF EXISTS "Admins can delete offers" ON offers;

CREATE POLICY "Users can read own offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update offers"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own offers status"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can delete offers"
  ON offers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to handle new user signup
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

-- Trigger to automatically create profile and balance on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();