/*
  # Remove Foreign Key Constraints for Demo

  1. Changes
    - Drop foreign key constraint from offers table
    - Drop foreign key constraint from conversions table
    - This allows the app to work without auth users for demo purposes
    
  2. Security Note
    - This is appropriate for a demo/prototype
    - For production, proper authentication and constraints should be implemented
*/

ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_user_id_fkey;
ALTER TABLE conversions DROP CONSTRAINT IF EXISTS conversions_user_id_fkey;
