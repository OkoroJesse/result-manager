-- FIX: Update Results Table Schema
-- The previous script didn't update the table because it already existed with old constraints.
-- We will explicit ALTER the table to match requirements.

-- 1. Fix Foreign Keys
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_session_id_fkey;
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_term_id_fkey;

-- Add correct FKs if they don't exist (or just add them, postgres handles names)
ALTER TABLE results 
    ADD CONSTRAINT results_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE;

ALTER TABLE results 
    ADD CONSTRAINT results_term_id_fkey 
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE;

-- 2. Ensure Columns Exist (Idempotent)
DO $$
BEGIN
    -- Scores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='score_ca') THEN
        ALTER TABLE results ADD COLUMN score_ca NUMERIC DEFAULT 0 CHECK (score_ca >= 0 AND score_ca <= 40);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='score_test') THEN
        ALTER TABLE results ADD COLUMN score_test NUMERIC DEFAULT 0 CHECK (score_test >= 0 AND score_test <= 20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='score_exam') THEN
        ALTER TABLE results ADD COLUMN score_exam NUMERIC DEFAULT 0 CHECK (score_exam >= 0 AND score_exam <= 40);
    END IF;

    -- Computed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='total_score') THEN
        ALTER TABLE results ADD COLUMN total_score NUMERIC DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='grade') THEN
        ALTER TABLE results ADD COLUMN grade VARCHAR(5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='remark') THEN
        ALTER TABLE results ADD COLUMN remark VARCHAR(50);
    END IF;
    
    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='status') THEN
        ALTER TABLE results ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published'));
    END IF;
END $$;

-- 3. Re-apply Trigger (Just to be sure)
CREATE OR REPLACE FUNCTION calculate_result_grades() RETURNS TRIGGER AS $$
BEGIN
    NEW.total_score := COALESCE(NEW.score_ca, 0) + COALESCE(NEW.score_test, 0) + COALESCE(NEW.score_exam, 0);
    IF NEW.total_score >= 70 THEN NEW.grade := 'A'; NEW.remark := 'EXCELLENT';
    ELSIF NEW.total_score >= 60 THEN NEW.grade := 'B'; NEW.remark := 'VERY GOOD';
    ELSIF NEW.total_score >= 50 THEN NEW.grade := 'C'; NEW.remark := 'GOOD';
    ELSIF NEW.total_score >= 45 THEN NEW.grade := 'D'; NEW.remark := 'FAIR';
    ELSIF NEW.total_score >= 40 THEN NEW.grade := 'E'; NEW.remark := 'PASS';
    ELSE NEW.grade := 'F'; NEW.remark := 'FAIL';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_grades ON results;
CREATE TRIGGER trigger_calculate_grades
    BEFORE INSERT OR UPDATE ON results
    FOR EACH ROW
    EXECUTE FUNCTION calculate_result_grades();
