-- EMERGENCY FIX: Enable Student Visibility for Teachers
-- Run this in Supabase SQL Editor NOW

-- 1. Temporarily allow teachers to see all students (we'll refine this later)
DROP POLICY IF EXISTS "Teachers read assigned students" ON students;
CREATE POLICY "Teachers read assigned students" 
ON students FOR SELECT 
TO authenticated 
USING (true);

-- 2. Ensure admins can see everything
DROP POLICY IF EXISTS "Admins full access students" ON students;
CREATE POLICY "Admins full access students"
ON students FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- 3. Verify RLS is enabled
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 4. Check teacher_assignments RLS
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers read own assignments" ON teacher_assignments;
CREATE POLICY "Teachers read own assignments"
ON teacher_assignments FOR SELECT
TO authenticated
USING (
  teacher_id IN (SELECT id FROM teachers WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage assignments" ON teacher_assignments;
CREATE POLICY "Admins manage assignments"
ON teacher_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);
