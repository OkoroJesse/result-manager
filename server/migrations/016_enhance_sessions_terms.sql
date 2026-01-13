-- Migration 016: Enhance Sessions & Terms
-- This migration enforces strict academic integrity and adds date support to terms.

-- 1. Enhance academic_sessions
ALTER TABLE academic_sessions 
ADD CONSTRAINT check_session_dates CHECK (end_date > start_date);

-- 2. Enhance terms
ALTER TABLE terms 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD CONSTRAINT check_term_dates CHECK (end_date > start_date);

-- Ensure terms names are standardized
ALTER TABLE terms 
DROP CONSTRAINT IF EXISTS terms_name_check;

ALTER TABLE terms
ADD CONSTRAINT terms_name_check CHECK (name IN ('First Term', 'Second Term', 'Third Term'));

-- 3. Atomicity via RPC (Stored Procedures)

-- Function to activate a session and deactivate all others
CREATE OR REPLACE FUNCTION fn_activate_session(target_session_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Deactivate all sessions
    UPDATE academic_sessions SET is_active = false;
    
    -- 2. Deactivate ALL terms institution-wide (clean slate)
    UPDATE terms SET is_active = false;
    
    -- 3. Activate target session
    UPDATE academic_sessions SET is_active = true WHERE id = target_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate a term within a session
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
    UPDATE terms SET is_active = false WHERE session_id = p_session_id;
    
    -- 4. Activate target term
    UPDATE terms SET is_active = true WHERE id = target_term_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policies
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- Admins: Full Access
DROP POLICY IF EXISTS "Admins full access on sessions" ON academic_sessions;
CREATE POLICY "Admins full access on sessions" ON academic_sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

DROP POLICY IF EXISTS "Admins full access on terms" ON terms;
CREATE POLICY "Admins full access on terms" ON terms FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND role_id IN (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- Others: Read-only
DROP POLICY IF EXISTS "Read access for all authenticated on sessions" ON academic_sessions;
CREATE POLICY "Read access for all authenticated on sessions" ON academic_sessions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Read access for all authenticated on terms" ON terms;
CREATE POLICY "Read access for all authenticated on terms" ON terms FOR SELECT USING (auth.role() = 'authenticated');
