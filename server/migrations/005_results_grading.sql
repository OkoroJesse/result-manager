-- MIGRATION: Results and Grading System

-- 1. Create/Update Results Table
-- We will recreate it to ensuring all constraints and types are correct.
-- If you have existing meaningful data, backup first. Assuming dev/early stage.

CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Scores (Default 0, constrained via check)
    score_ca NUMERIC DEFAULT 0 CHECK (score_ca >= 0 AND score_ca <= 40),
    score_test NUMERIC DEFAULT 0 CHECK (score_test >= 0 AND score_test <= 20),
    score_exam NUMERIC DEFAULT 0 CHECK (score_exam >= 0 AND score_exam <= 40),
    
    -- Computed info (Managed by Trigger)
    total_score NUMERIC DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
    grade VARCHAR(5),
    remark VARCHAR(50),
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- e.g. teacher user id

    -- prevent duplicates for same student-subject-term
    UNIQUE(student_id, subject_id, session_id, term_id)
);

-- 2. Create Grading Function
CREATE OR REPLACE FUNCTION calculate_result_grades() RETURNS TRIGGER AS $$
BEGIN
    -- Calculate Total
    NEW.total_score := COALESCE(NEW.score_ca, 0) + COALESCE(NEW.score_test, 0) + COALESCE(NEW.score_exam, 0);

    -- Assign Grade & Remark
    IF NEW.total_score >= 70 THEN
        NEW.grade := 'A';
        NEW.remark := 'EXCELLENT';
    ELSIF NEW.total_score >= 60 THEN
        NEW.grade := 'B';
        NEW.remark := 'VERY GOOD';
    ELSIF NEW.total_score >= 50 THEN
        NEW.grade := 'C';
        NEW.remark := 'GOOD';
    ELSIF NEW.total_score >= 45 THEN
        NEW.grade := 'D';
        NEW.remark := 'FAIR';
    ELSIF NEW.total_score >= 40 THEN
        NEW.grade := 'E';
        NEW.remark := 'PASS';
    ELSE
        NEW.grade := 'F';
        NEW.remark := 'FAIL';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger
DROP TRIGGER IF EXISTS trigger_calculate_grades ON results;
CREATE TRIGGER trigger_calculate_grades
    BEFORE INSERT OR UPDATE ON results
    FOR EACH ROW
    EXECUTE FUNCTION calculate_result_grades();

-- 4. Enable RLS (Safety)
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on your auth setup, here giving broad permissions for dev/admin)
-- Teachers can insert/update their own drafts (logic usually handled in API, but RLS adds layer)
-- Admins can do everything.
-- For now, allowing all authenticated for implementation speed, relying on API logic for constraints.
CREATE POLICY "Enable all for authenticated" ON results FOR ALL USING (auth.role() = 'authenticated');
