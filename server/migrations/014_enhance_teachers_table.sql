-- Migration 014: Enhance Teachers Table (Fixed & Robust)
-- This migration aligns the teachers table with production requirements:
-- 1. Adds necessary columns if they are missing (first_name, last_name, email, staff_id, status)
-- 2. Makes auth_user_id nullable (decoupling auth from record creation)
-- 3. Implements teacher_assignments with unique constraints
-- 4. Enables RLS

-- 1. Ensure core columns exist (ADD COLUMN IF NOT EXISTS is safe)
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS staff_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Handle column renaming and types safely
DO $$ 
BEGIN
  -- Rename user_id to auth_user_id if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='user_id') THEN
    ALTER TABLE teachers RENAME COLUMN user_id TO auth_user_id;
  END IF;
  
  -- Ensure auth_user_id is nullable
  ALTER TABLE teachers ALTER COLUMN auth_user_id DROP NOT NULL;
END $$;

-- 3. Cleanup old columns if they exist (full_name was used previously)
DO $$
BEGIN
    -- If full_name exists, try to split it into first/last name for existing data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='full_name') THEN
        UPDATE teachers SET 
            first_name = COALESCE(first_name, SPLIT_PART(full_name, ' ', 1)),
            last_name = COALESCE(last_name, SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
        WHERE first_name IS NULL OR last_name IS NULL;
        
        ALTER TABLE teachers DROP COLUMN full_name;
    END IF;
END $$;

-- 4. Set constraints
-- Provide defaults for existing null data so NOT NULL succeeds
UPDATE teachers SET first_name = 'Staff' WHERE first_name IS NULL;
UPDATE teachers SET last_name = 'Member' WHERE last_name IS NULL;
UPDATE teachers SET email = 'unknown' || id || '@school.com' WHERE email IS NULL;

ALTER TABLE teachers ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE teachers ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE teachers ALTER COLUMN email SET NOT NULL;

-- 5. Add Unique constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_email_key') THEN
        ALTER TABLE teachers ADD CONSTRAINT teachers_email_key UNIQUE (email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_staff_id_key') THEN
        ALTER TABLE teachers ADD CONSTRAINT teachers_staff_id_key UNIQUE (staff_id);
    END IF;
END $$;

-- 6. teacher_assignments table enhancement
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (teacher_id, class_id, subject_id)
);

-- 7. RLS Policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Admins: Full Access
DROP POLICY IF EXISTS "Admins full access on teachers" ON teachers;
CREATE POLICY "Admins full access on teachers"
ON teachers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

DROP POLICY IF EXISTS "Admins full access on assignments" ON teacher_assignments;
CREATE POLICY "Admins full access on assignments"
ON teacher_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Teachers: Read own profile
DROP POLICY IF EXISTS "Teachers read own profile" ON teachers;
CREATE POLICY "Teachers read own profile"
ON teachers FOR SELECT
USING (auth_user_id = auth.uid());

-- Teachers: Read own assignments
DROP POLICY IF EXISTS "Teachers read own assignments" ON teacher_assignments;
CREATE POLICY "Teachers read own assignments"
ON teacher_assignments FOR SELECT
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE auth_user_id = auth.uid()
  )
);
