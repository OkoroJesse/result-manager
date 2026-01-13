-- Migration 020: Production Refactor for Terms Module
-- This migration standardizes the terms table for professional use.

-- 1. Ensure core columns exist and add 'status'
ALTER TABLE terms 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Backfill dates for existing terms to avoid NOT NULL failures
-- Fallback: Use dates from parent academic_session
UPDATE terms t
SET 
  start_date = COALESCE(t.start_date, s.start_date),
  end_date = COALESCE(t.end_date, s.end_date)
FROM academic_sessions s
WHERE t.session_id = s.id
AND (t.start_date IS NULL OR t.end_date IS NULL);

-- 3. Enforce constraints
ALTER TABLE terms ALTER COLUMN name SET NOT NULL;
ALTER TABLE terms ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE terms ALTER COLUMN end_date SET NOT NULL;
ALTER TABLE terms ADD CONSTRAINT check_term_dates_valid CHECK (end_date > start_date);

-- 4. Fix activation procedure (Safe for production with explicit checks)
CREATE OR REPLACE FUNCTION fn_activate_term(target_term_id UUID)
RETURNS VOID AS $$
DECLARE
    p_session_id UUID;
    session_is_active BOOLEAN;
    t_start_date DATE;
    t_end_date DATE;
BEGIN
    -- 1. Get term details and parent session status
    SELECT session_id, i.is_active, t.start_date, t.end_date 
    INTO p_session_id, session_is_active, t_start_date, t_end_date
    FROM terms t
    JOIN academic_sessions i ON i.id = t.session_id
    WHERE t.id = target_term_id;
    
    -- 2. Validations
    IF session_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Cannot activate term: Parent session is not active.';
    END IF;

    IF t_start_date IS NULL OR t_end_date IS NULL THEN
        RAISE EXCEPTION 'Cannot activate term: Start and end dates must be set.';
    END IF;
    
    -- 3. Atomicity: Deactivate other terms in same session and activate target
    -- Use WHERE exists checks to bypass "safe-mode" errors if applicable
    UPDATE terms SET is_active = false, status = 'closed'
    WHERE session_id = p_session_id AND is_active = true;
    
    UPDATE terms SET is_active = true, status = 'active'
    WHERE id = target_term_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Prevent deletion if results exist
CREATE OR REPLACE FUNCTION fn_check_term_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM results WHERE term_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete term: Results are already linked to this term.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_term_deletion ON terms;
CREATE TRIGGER trigger_prevent_term_deletion
    BEFORE DELETE ON terms
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_term_deletion();
