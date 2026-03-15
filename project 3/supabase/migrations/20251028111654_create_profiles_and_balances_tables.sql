/*
  # Create User Profiles and Balances Tables

  ## Overview
  This migration creates the foundational tables for user accounts and their financial balances in the Cank application.

  ## New Tables
  
  ### 1. `profiles`
  Stores user account information
  - `id` (uuid, primary key) - Unique user identifier
  - `first_name` (text) - User's first name (e.g., "John")
  - `full_name` (text) - User's full name (e.g., "John Smith")
  - `account_number` (integer) - User's account number
  - `currency` (text) - Account currency code (e.g., "EGP")
  - `currency_symbol` (text) - Currency symbol for display (e.g., "L.E.")
  - `created_at` (timestamptz) - When the profile was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `balances`
  Stores user financial balances
  - `id` (uuid, primary key) - Unique balance record identifier
  - `user_id` (uuid, foreign key) - References the user in profiles table
  - `cards_balance` (decimal) - Balance available in cards wallet
  - `collect_balance` (decimal) - Balance available in collect/receivables wallet
  - `updated_at` (timestamptz) - Last balance update timestamp

  ## Security
  - Enable RLS (Row Level Security) on both tables
  - Users can only read and update their own data
  - No public access - authentication required

  ## Important Notes
  - Balances default to 0.00
  - Each user has exactly one balance record
  - Currency defaults to "EGP" (Egyptian Pound)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  account_number integer NOT NULL DEFAULT 1,
  currency text NOT NULL DEFAULT 'EGP',
  currency_symbol text NOT NULL DEFAULT 'L.E.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cards_balance decimal(10, 2) NOT NULL DEFAULT 0.00,
  collect_balance decimal(10, 2) NOT NULL DEFAULT 0.00,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

-- Profiles policies: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Balances policies: users can read and update their own balances
CREATE POLICY "Users can view own balances"
  ON balances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own balances"
  ON balances FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own balances"
  ON balances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS balances_user_id_idx ON balances(user_id);