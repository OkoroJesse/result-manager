-- MIGRATION: Result Status Update
-- Run this in Supabase SQL Editor

-- 1. Update Check Constraint for Status
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_status_check;
ALTER TABLE results ADD CONSTRAINT results_status_check 
CHECK (status IN ('draft', 'approved', 'published', 'archived'));

-- 2. Optional: Add index for status filtering if not exists
CREATE INDEX IF NOT EXISTS idx_results_status ON results(status);
