/*
  # Create User Profiles and Balances Tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `first_name` (text)
      - `full_name` (text)
      - `account_number` (bigint, unique)
      - `account_currency` (text, default 'EGP')
      - `account_symbol` (text, default 'L.E.')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `balances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles, unique)
      - `cards` (numeric, default 0)
      - `collect` (numeric, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/update their own data
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  account_number bigint UNIQUE NOT NULL DEFAULT floor(random() * 9000000000 + 1000000000)::bigint,
  account_currency text NOT NULL DEFAULT 'EGP',
  account_symbol text NOT NULL DEFAULT 'L.E.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cards numeric NOT NULL DEFAULT 0,
  collect numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own balances"
  ON balances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own balances"
  ON balances FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
