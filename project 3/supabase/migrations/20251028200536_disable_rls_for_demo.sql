/*
  # Disable RLS for Demo Mode

  1. Changes
    - Disable RLS on offers table for demo purposes
    - This allows the admin panel to work without authentication
    
  2. Security Note
    - This is appropriate for a demo/prototype
    - For production, proper authentication should be implemented
*/

ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
