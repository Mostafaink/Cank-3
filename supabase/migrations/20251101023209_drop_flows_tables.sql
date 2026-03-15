/*
  # Drop Flow-Related Tables

  1. Changes
    - Drop user_flows table
    - Drop flows table
  
  2. Notes
    - Removes all flow management functionality
    - Cleans up unused database structures
*/

DROP TABLE IF EXISTS user_flows CASCADE;
DROP TABLE IF EXISTS flows CASCADE;