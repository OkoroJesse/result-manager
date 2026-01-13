-- Migration 018: Fix Safe Update Violation in RPC Functions
-- Adding WHERE clauses to UPDATE statements to bypass "db-safe-mode" errors.

-- 1. Fix fn_activate_session
CREATE OR REPLACE FUNCTION fn_activate_session(target_session_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Deactivate all sessions
    UPDATE academic_sessions SET is_active = false WHERE is_active = true;
    
    -- 2. Deactivate ALL terms institution-wide (clean slate)
    UPDATE terms SET is_active = false WHERE is_active = true;
    
    -- 3. Activate target session
    UPDATE academic_sessions SET is_active = true WHERE id = target_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix fn_activate_term (Already has WHERE clause, but re-applying for consistency/integrity)
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
