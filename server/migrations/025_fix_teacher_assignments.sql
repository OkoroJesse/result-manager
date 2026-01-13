-- Migration 025: Production-Critical Teacher Assignment Fixes
-- Adds academic session scoping and RLS policies
-- SAFE: Non-destructive, preserves all existing data

-- 1. Add new columns (nullable first for safe migration)
ALTER TABLE teacher_assignments 
ADD COLUMN IF NOT EXISTS academic_session_id UUID,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Backfill academic_session_id with current active session
-- This ensures existing assignments are preserved
UPDATE teacher_assignments 
SET academic_session_id = (
    SELECT id FROM sessions WHERE is_active = true ORDER BY created_at DESC LIMIT 1
)
WHERE academic_session_id IS NULL;

-- 3. If no active session exists, use the most recent session
UPDATE teacher_assignments 
SET academic_session_id = (
    SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
)
WHERE academic_session_id IS NULL;

-- 4. Now make it NOT NULL (safe after backfill)
ALTER TABLE teacher_assignments 
ALTER COLUMN academic_session_id SET NOT NULL;

-- 5. Add foreign key constraint
ALTER TABLE teacher_assignments 
ADD CONSTRAINT fk_teacher_assignments_session 
FOREIGN KEY (academic_session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- 6. Update unique constraint to include session
ALTER TABLE teacher_assignments 
DROP CONSTRAINT IF EXISTS unique_teacher_assignment;

ALTER TABLE teacher_assignments 
ADD CONSTRAINT unique_teacher_assignment 
UNIQUE (teacher_id, class_id, subject_id, academic_session_id);

-- 7. Enable RLS
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 8. Teachers can read their own assignments
DROP POLICY IF EXISTS "Teachers read own assignments" ON teacher_assignments;
CREATE POLICY "Teachers read own assignments"
ON teacher_assignments FOR SELECT
USING (
  teacher_id IN (SELECT id FROM teachers WHERE auth_user_id = auth.uid())
);

-- 9. Admins have full access
DROP POLICY IF EXISTS "Admins manage assignments" ON teacher_assignments;
CREATE POLICY "Admins manage assignments"
ON teacher_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- 10. Create index for performance
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_session 
ON teacher_assignments(academic_session_id, is_active);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_active 
ON teacher_assignments(teacher_id, is_active, academic_session_id);
