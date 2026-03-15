/*
  # Remove Unwanted Tables

  1. Changes
    - Drop `balances` table (not requested by user)
    - Drop `profiles` table (not requested by user)
  
  2. Notes
    - These tables were created without user approval
    - Keeping only `offers` and `offer_combinations` tables
*/

DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
