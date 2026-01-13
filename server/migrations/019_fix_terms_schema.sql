-- Migration 019: Fix Terms Schema
-- Ensures session_id exists and re-establishes integrity for terms.

-- 1. Add session_id if missing
ALTER TABLE terms ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE;

-- 2. Backfill existing terms
UPDATE terms 
SET session_id = (SELECT id FROM academic_sessions WHERE is_active = true LIMIT 1)
WHERE session_id IS NULL AND EXISTS (SELECT 1 FROM academic_sessions WHERE is_active = true);

UPDATE terms 
SET session_id = (SELECT id FROM academic_sessions ORDER BY created_at DESC LIMIT 1)
WHERE session_id IS NULL AND EXISTS (SELECT 1 FROM academic_sessions);

-- 3. Re-apply Unique Constraints (Drop first to avoid duplicates)
ALTER TABLE terms DROP CONSTRAINT IF EXISTS unique_term_name_per_session;
ALTER TABLE terms ADD CONSTRAINT unique_term_name_per_session UNIQUE (session_id, name);

ALTER TABLE terms DROP CONSTRAINT IF EXISTS unique_term_order_per_session;
ALTER TABLE terms ADD CONSTRAINT unique_term_order_per_session UNIQUE (session_id, "order");

-- 4. Re-create activation function with proper WHERE clauses (bypass safe-mode)
CREATE OR REPLACE FUNCTION fn_activate_term(target_term_id UUID)
RETURNS VOID AS $$
DECLARE
    p_session_id UUID;
    session_is_active BOOLEAN;
BEGIN
    -- 1. Get parent session and its status
    SELECT session_id, i.is_active INTO p_session_id, session_is_active 
    FROM terms t
    JOIN academic_sessions i ON i.id = t.session_id
    WHERE t.id = target_term_id;
    
    -- 2. Validate session is active
    IF session_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Cannot activate term: Parent session is not active.';
    END IF;
    
    -- 3. Deactivate other terms in same session
    UPDATE terms SET is_active = false WHERE session_id = p_session_id AND is_active = true;
    
    -- 4. Activate target term
    UPDATE terms SET is_active = true WHERE id = target_term_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Re-create active term index
DROP INDEX IF EXISTS one_active_term_per_session_idx;
CREATE UNIQUE INDEX one_active_term_per_session_idx ON terms (session_id, is_active) WHERE is_active = true;
