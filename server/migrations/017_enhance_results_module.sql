-- Migration 017: Enhance Results & Grading Module
-- This migration implements dynamic grading scales and an auditable approval workflow.

-- 1. Create grading_scales table
CREATE TABLE IF NOT EXISTS grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_score INT NOT NULL,
    max_score INT NOT NULL,
    grade VARCHAR(5) NOT NULL,
    remark TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_score_range CHECK (max_score >= min_score)
);

-- Seed standard grading scale
INSERT INTO grading_scales (min_score, max_score, grade, remark) VALUES
(75, 100, 'A1', 'EXCELLENT'),
(70, 74,  'B2', 'VERY GOOD'),
(65, 69,  'B3', 'GOOD'),
(60, 64,  'C4', 'CREDIT'),
(55, 59,  'C5', 'CREDIT'),
(50, 54,  'C6', 'CREDIT'),
(45, 49,  'D7', 'PASS'),
(40, 44,  'E8', 'PASS'),
(0,  39,  'F9', 'FAIL')
ON CONFLICT DO NOTHING;

-- 2. Enhance results table
-- Add audit columns and update status constraint
ALTER TABLE results 
ADD COLUMN IF NOT EXISTS entered_by UUID REFERENCES teachers(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Update status constraint safely
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_status_check;
ALTER TABLE results ADD CONSTRAINT results_status_check CHECK (status IN ('draft', 'submitted', 'approved'));

-- Add unique constraint for terminal result per student/subject
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_student_id_subject_id_session_id_term_id_key;
ALTER TABLE results ADD CONSTRAINT results_student_id_subject_id_session_id_term_id_key 
UNIQUE (student_id, subject_id, session_id, term_id);

-- 3. Dynamic Grading Trigger
CREATE OR REPLACE FUNCTION calculate_result_grades() RETURNS TRIGGER AS $$
DECLARE
    v_grade VARCHAR(5);
    v_remark TEXT;
BEGIN
    -- Calculate Total
    NEW.total_score := COALESCE(NEW.score_ca, 0) + COALESCE(NEW.score_test, 0) + COALESCE(NEW.score_exam, 0);

    -- Fetch from dynamic grading_scales
    SELECT grade, remark INTO v_grade, v_remark
    FROM grading_scales
    WHERE NEW.total_score >= min_score AND NEW.total_score <= max_score
    LIMIT 1;

    NEW.grade := COALESCE(v_grade, 'F9');
    NEW.remark := COALESCE(v_remark, 'FAIL');
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger
DROP TRIGGER IF EXISTS trigger_calculate_grades ON results;
CREATE TRIGGER trigger_calculate_grades
    BEFORE INSERT OR UPDATE ON results
    FOR EACH ROW
    EXECUTE FUNCTION calculate_result_grades();

-- 4. RLS Policies
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;

-- Grading Scales: Read for all, Write for Admin
DROP POLICY IF EXISTS "Read access for all on grading_scales" ON grading_scales;
CREATE POLICY "Read access for all on grading_scales" ON grading_scales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access on grading_scales" ON grading_scales;
CREATE POLICY "Admin full access on grading_scales" ON grading_scales FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Results: Strict Workflow RLS
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Teachers: 
-- 1. Read access to results they entered or are assigned to
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

-- 2. Insert/Update only if status is draft and they are assigned
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

-- Admins: Full Access
DROP POLICY IF EXISTS "Admins full access on results" ON results;
CREATE POLICY "Admins full access on results" ON results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Students: Read only approved results for self
DROP POLICY IF EXISTS "Students can read approved results" ON results;
CREATE POLICY "Students can read approved results" ON results FOR SELECT USING (
    status = 'approved' AND
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
);
