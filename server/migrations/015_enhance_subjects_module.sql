-- Migration 015: Enhance Subjects Module
-- This migration aligns the subjects and class_subjects tables with production requirements:
-- 1. Standardizes columns (category, status)
-- 2. Adds is_compulsory flag to class_subjects
-- 3. Enables RLS

-- 1. Enhance subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('primary', 'secondary')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Handle legacy 'level' column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='level') THEN
    UPDATE subjects SET category = CASE 
      WHEN level IN ('PRIMARY') THEN 'primary'
      ELSE 'secondary'
    END WHERE category IS NULL;
    
    -- We'll keep 'level' for now to avoid breaking existing queries until code is updated, 
    -- but later we might drop it.
  END IF;

  -- Handle legacy 'is_active' column if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='is_active') THEN
    UPDATE subjects SET status = CASE 
      WHEN is_active = true THEN 'active'
      ELSE 'inactive'
    END WHERE status IS NULL;
  END IF;
END $$;

-- 2. Enhance class_subjects table
ALTER TABLE class_subjects 
ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN DEFAULT true;

-- Ensure UNIQUE constraint on (class_id, subject_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_subjects_class_id_subject_id_key') THEN
        ALTER TABLE class_subjects ADD CONSTRAINT class_subjects_class_id_subject_id_key UNIQUE (class_id, subject_id);
    END IF;
END $$;

-- 3. RLS Policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;

-- Admins: Full Access
DROP POLICY IF EXISTS "Admins full access on subjects" ON subjects;
CREATE POLICY "Admins full access on subjects" ON subjects FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

DROP POLICY IF EXISTS "Admins full access on class_subjects" ON class_subjects;
CREATE POLICY "Admins full access on class_subjects" ON class_subjects FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Others (Teachers, Students, Parents): Read-only
DROP POLICY IF EXISTS "Read access for all authenticated on subjects" ON subjects;
CREATE POLICY "Read access for all authenticated on subjects" ON subjects FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Read access for all authenticated on class_subjects" ON class_subjects;
CREATE POLICY "Read access for all authenticated on class_subjects" ON class_subjects FOR SELECT USING (auth.role() = 'authenticated');
