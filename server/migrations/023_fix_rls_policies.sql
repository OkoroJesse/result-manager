-- Migration 023: Fix RLS Policies for Teacher Access
-- This fix ensures teachers can see students in their assigned classes
-- and manage results for those classes correctly.

-- 1. Fix Students RLS
-- The previous policy incorrectly compared auth.uid() to teacher_id directly
DROP POLICY IF EXISTS "Teachers read assigned students" ON students;
CREATE POLICY "Teachers read assigned students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE t.auth_user_id = auth.uid()
    AND ta.class_id = students.class_id
  )
);

-- 2. Verify Results RLS (Ensure it's using the same robust check)
-- This policy is already relatively robust in 017, but let's ensure it's optimal
DROP POLICY IF EXISTS "Teachers can read assigned results" ON results;
CREATE POLICY "Teachers can read assigned results" ON results FOR SELECT USING (
    entered_by IN (SELECT id FROM teachers WHERE auth_user_id = auth.uid())
    OR 
    EXISTS (
        SELECT 1 FROM teacher_assignments ta
        JOIN teachers t ON t.id = ta.teacher_id
        WHERE t.auth_user_id = auth.uid()
        AND ta.class_id = results.class_id
        AND ta.subject_id = results.subject_id
    )
);

DROP POLICY IF EXISTS "Teachers can manage draft results" ON results;
CREATE POLICY "Teachers can manage draft results" ON results FOR ALL USING (
    status = 'draft' AND
    EXISTS (
        SELECT 1 FROM teacher_assignments ta
        JOIN teachers t ON t.id = ta.teacher_id
        WHERE t.auth_user_id = auth.uid()
        AND ta.class_id = results.class_id
        AND ta.subject_id = results.subject_id
    )
) WITH CHECK (
    status = 'draft' AND
    EXISTS (
        SELECT 1 FROM teacher_assignments ta
        JOIN teachers t ON t.id = ta.teacher_id
        WHERE t.auth_user_id = auth.uid()
        AND ta.class_id = results.class_id
        AND ta.subject_id = results.subject_id
    )
);
