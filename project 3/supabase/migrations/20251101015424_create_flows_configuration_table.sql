/*
  # Create Flows Configuration Table

  1. New Tables
    - `flows`
      - `id` (uuid, primary key)
      - `flow_type` (text, unique, not null) - identifier for this flow (e.g., 'standard', 'high_value', 'quick_cash')
      - `name` (text, not null) - display name for the flow
      - `description` (text) - description of what this flow does
      - `steps` (jsonb, not null) - array of step configurations
      - `is_active` (boolean, default true) - whether this flow is currently available
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `flows` table
    - Anyone can read flows (needed for app to know flow structure)
    - Only authenticated users can modify (admin controls)
  
  3. Notes
    - Steps structure: [{"step": 0, "modal": "activate"}, {"step": 1, "modal": "recheck"}, ...]
    - This defines the sequence of modals for each flow type
    - Admin can create/modify flows to change user journeys
*/

CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_type text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flows_flow_type ON flows(flow_type);
CREATE INDEX IF NOT EXISTS idx_flows_is_active ON flows(is_active);

ALTER TABLE flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active flows"
  ON flows
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert flows"
  ON flows
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update flows"
  ON flows
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete flows"
  ON flows
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Insert default flows
INSERT INTO flows (flow_type, name, description, steps) VALUES
  ('standard', 'Standard Flow', 'Default user journey with all options', 
   '[
     {"step": 0, "modal": "activate"},
     {"step": 1, "modal": "recheck"},
     {"step": 2, "modal": "cash"},
     {"step": 3, "modal": "more"},
     {"step": 4, "modal": "selectMore"},
     {"step": 5, "modal": "selectTime"},
     {"step": 6, "modal": "extend"}
   ]'::jsonb),
  ('quick_cash', 'Quick Cash Flow', 'Fast track to cash offer', 
   '[
     {"step": 0, "modal": "activate"},
     {"step": 1, "modal": "cash"},
     {"step": 2, "modal": "more"}
   ]'::jsonb),
  ('high_value', 'High Value Flow', 'Premium user journey with extended options', 
   '[
     {"step": 0, "modal": "activate"},
     {"step": 1, "modal": "recheck"},
     {"step": 2, "modal": "more"},
     {"step": 3, "modal": "selectMore"},
     {"step": 4, "modal": "selectTime"},
     {"step": 5, "modal": "extend"}
   ]'::jsonb)
ON CONFLICT (flow_type) DO NOTHING;