-- Migration 028: Unify Session Tables (REVISED)
-- Consolidates 'academic_sessions' into 'sessions' table and fixes foreign keys

-- 1. DROP EXISTING CONSTRAINTS point to academic_sessions
-- This prevents violation errors when we change the session_id to point to the 'sessions' table
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_session_id_fkey;
ALTER TABLE terms DROP CONSTRAINT IF EXISTS terms_session_id_fkey;
-- Additional safety drop for different constraint name patterns
ALTER TABLE terms DROP CONSTRAINT IF EXISTS terms_session_id_academic_sessions_id_fk;
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_session_id_academic_sessions_id_fk;

-- 2. Create a mapping and update 'terms' and 'results' tables
DO $$
DECLARE
    sess_record RECORD;
    acad_sess_id UUID;
BEGIN
    FOR sess_record IN SELECT id, name FROM sessions LOOP
        -- Find the corresponding ID in academic_sessions
        SELECT id INTO acad_sess_id FROM academic_sessions WHERE name = sess_record.name LIMIT 1;
        
        IF acad_sess_id IS NOT NULL THEN
            -- Update terms pointing to the old ID
            UPDATE terms SET session_id = sess_record.id WHERE session_id = acad_sess_id;
            
            -- Update results pointing to the old ID
            UPDATE results SET session_id = sess_record.id WHERE session_id = acad_sess_id;
        END IF;
    END LOOP;
END $$;

-- 3. Add new foreign key constraints pointing to the 'sessions' table
ALTER TABLE results 
ADD CONSTRAINT results_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

ALTER TABLE terms 
ADD CONSTRAINT terms_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- 4. Sync active status (Ensure 'sessions' is active if 'academic_sessions' was)
UPDATE sessions s
SET is_active = true
FROM academic_sessions a
WHERE s.name = a.name AND a.is_active = true;

-- 5. Final check: delete any remaining academic_sessions to prevent confusion
-- DELETE FROM academic_sessions;
