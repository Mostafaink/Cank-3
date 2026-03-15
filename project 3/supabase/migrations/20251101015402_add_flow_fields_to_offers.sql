/*
  # Add Flow Fields to Offers Table

  1. Changes
    - Add `flow_type` column to offers table - identifies which flow this offer belongs to
    - Add `step_number` column to offers table - identifies at which step in the flow this offer appears
  
  2. Notes
    - Existing offers will have NULL values initially
    - Admin can set these values to control which offers appear in which flows at which steps
    - Multiple offers can have the same flow_type + step_number combination
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'flow_type'
  ) THEN
    ALTER TABLE offers ADD COLUMN flow_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'step_number'
  ) THEN
    ALTER TABLE offers ADD COLUMN step_number integer;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_offers_flow_step ON offers(flow_type, step_number);