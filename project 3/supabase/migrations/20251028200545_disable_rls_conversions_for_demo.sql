/*
  # Disable RLS for Conversions Table

  1. Changes
    - Disable RLS on conversions table for demo purposes
    - This allows conversion tracking to work without authentication
    
  2. Security Note
    - This is appropriate for a demo/prototype
    - For production, proper authentication should be implemented
*/

ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;
