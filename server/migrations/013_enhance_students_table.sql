-- Migration 013: Enhance Students Table (Idempotent & Safe)
-- This migration aligns the students table with production requirements:
-- 1. Adds first_name, last_name, gender, status safely
-- 2. Renames columns for clarity ONLY if they haven't been renamed already
-- 3. Migrates data from users table to students table before enforcing NOT NULL

-- 1. Add columns to students table as NULLABLE initially (important for existing data)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'withdrawn'));

-- 2. Rename columns for clarity only if they exist
DO $$ 
BEGIN
  -- Rename current_class_id to class_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='current_class_id') THEN
    ALTER TABLE students RENAME COLUMN current_class_id TO class_id;
  END IF;
  
  -- Rename user_id to auth_user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='user_id') THEN
    ALTER TABLE students RENAME COLUMN user_id TO auth_user_id;
  END IF;
END $$;

-- 3. Add is_active to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. MIGRATE DATA: Populate names from users table into students table
-- This prevents the "contains null values" error when we enforce NOT NULL
UPDATE students 
SET 
  first_name = u.first_name,
  last_name = u.last_name
FROM users u
WHERE students.auth_user_id = u.id
AND (students.first_name IS NULL OR students.last_name IS NULL);

-- 5. Fallback for orphans: Provide defaults so NOT NULL constraints don't fail
-- This handles any students who don't have a linked user account yet
UPDATE students 
SET 
  first_name = COALESCE(first_name, 'Student'),
  last_name = COALESCE(last_name, 'User'),
  gender = COALESCE(gender, 'male')
WHERE first_name IS NULL OR last_name IS NULL OR gender IS NULL;

-- 6. Now that data is populated, enforce NOT NULL constraints
ALTER TABLE students ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN class_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN gender SET NOT NULL;
ALTER TABLE students ALTER COLUMN admission_number SET NOT NULL;

-- 7. Add Unique constraint on admission_number safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_admission_number_key') THEN
        ALTER TABLE students ADD CONSTRAINT students_admission_number_key UNIQUE (admission_number);
    END IF;
END $$;

-- 8. Enable RLS and update Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Admin: Full Access
DROP POLICY IF EXISTS "Admins full access on students" ON students;
CREATE POLICY "Admins full access on students"
ON students FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Teacher: Read-only for assigned classes
DROP POLICY IF EXISTS "Teachers read assigned students" ON students;
CREATE POLICY "Teachers read assigned students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    WHERE ta.teacher_id = auth.uid()
    AND ta.class_id = students.class_id
  )
);

-- Student: Read-only for own record
DROP POLICY IF EXISTS "Students read own record" ON students;
CREATE POLICY "Students read own record"
ON students FOR SELECT
USING (auth_user_id = auth.uid());
