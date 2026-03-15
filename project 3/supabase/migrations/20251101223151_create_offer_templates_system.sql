/*
  # Create Offer Templates System

  ## Overview
  This migration creates a reusable offer template system that separates offer configurations 
  (templates) from user-specific offer instances. This allows admins to create offer templates 
  once and assign them to multiple users without recreating the same offer configuration repeatedly.

  ## 1. New Tables
  
  ### `offer_templates`
  Stores reusable offer configurations that can be assigned to multiple users.
  - `id` (uuid, primary key) - unique template identifier
  - `name` (text, not null) - descriptive name for the template (e.g., "100 EGP Cash Offer")
  - `type` (text, not null) - 'cash' or 'receivables'
  - `amount` (numeric, default 0) - offer amount
  - `config` (jsonb, default '{}') - combinations, schedules, enabled counts for receivables
  - `is_active` (boolean, default true) - whether template can be assigned to new users
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `offer_assignments`
  Tracks the history of offer assignments and acceptances for analytics and auditing.
  - `id` (uuid, primary key)
  - `template_id` (uuid, references offer_templates) - which template was assigned
  - `offer_id` (uuid, references offers) - which offer instance was created
  - `user_id` (text, not null) - which user received the offer
  - `status` (text, default 'assigned') - 'assigned', 'accepted', 'expired', 'cancelled'
  - `assigned_at` (timestamptz, default now())
  - `accepted_at` (timestamptz, nullable)
  - `metadata` (jsonb, default '{}') - additional tracking data

  ## 2. Schema Changes to Existing Tables
  
  ### `offers` table modifications
  - Add `template_id` (uuid, nullable, references offer_templates) - link to source template
  - Add `is_template_instance` (boolean, default false) - whether this offer was created from a template

  ## 3. Security
  - Enable RLS on both new tables
  - Add policies for public read access (for demo purposes)
  - Add policies for authenticated users to manage templates and assignments

  ## 4. Indexes
  - Index on offer_templates.type for faster filtering
  - Index on offer_templates.is_active for active template queries
  - Index on offer_assignments.template_id for template usage analytics
  - Index on offer_assignments.user_id for user-specific offer history
  - Index on offer_assignments.status for filtering by assignment status

  ## 5. Important Notes
  - Templates can be created, edited, and soft-deleted (is_active = false)
  - Each template can be assigned to multiple users, creating separate offer instances
  - Offer assignments track the complete lifecycle from assignment to acceptance
  - The existing offers table structure is preserved for backward compatibility
  - RLS is intentionally permissive for demo purposes (should be locked down in production)
*/

-- Create offer_templates table
CREATE TABLE IF NOT EXISTS offer_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'receivables')),
  amount numeric DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create offer_assignments table for tracking
CREATE TABLE IF NOT EXISTS offer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES offer_templates(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES offers(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'expired', 'cancelled')),
  assigned_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add columns to existing offers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE offers ADD COLUMN template_id uuid REFERENCES offer_templates(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'is_template_instance'
  ) THEN
    ALTER TABLE offers ADD COLUMN is_template_instance boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offer_templates_type ON offer_templates(type);
CREATE INDEX IF NOT EXISTS idx_offer_templates_is_active ON offer_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_offer_assignments_template_id ON offer_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_offer_assignments_user_id ON offer_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_assignments_status ON offer_assignments(status);
CREATE INDEX IF NOT EXISTS idx_offers_template_id ON offers(template_id);

-- Enable RLS on new tables
ALTER TABLE offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offer_templates (permissive for demo)
CREATE POLICY "Anyone can read offer templates"
  ON offer_templates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert offer templates"
  ON offer_templates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update offer templates"
  ON offer_templates
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete offer templates"
  ON offer_templates
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- RLS Policies for offer_assignments (permissive for demo)
CREATE POLICY "Anyone can read offer assignments"
  ON offer_assignments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert offer assignments"
  ON offer_assignments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update offer assignments"
  ON offer_assignments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete offer assignments"
  ON offer_assignments
  FOR DELETE
  TO anon, authenticated
  USING (true);