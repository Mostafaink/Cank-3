/*
  # Remove Flow Fields from Offers Table

  1. Changes
    - Drop flow_type column from offers table
    - Drop step_number column from offers table
    - Drop index on flow_type and step_number
  
  2. Notes
    - Removes flow-related fields that are no longer needed
*/

DROP INDEX IF EXISTS idx_offers_flow_step;

ALTER TABLE offers DROP COLUMN IF EXISTS flow_type;
ALTER TABLE offers DROP COLUMN IF EXISTS step_number;