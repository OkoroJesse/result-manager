-- Migration: Scope Terms to Sessions
-- Decoupling terms from global scope to per-session scope

-- 1. Add session_id to terms table if not exists
ALTER TABLE terms ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE;

-- 2. Link existing terms to the active session (if any)
UPDATE terms 
SET session_id = (SELECT id FROM academic_sessions WHERE is_active = true LIMIT 1)
WHERE session_id IS NULL AND EXISTS (SELECT 1 FROM academic_sessions WHERE is_active = true);

-- 3. Link remaining terms to the latest created session if still NULL
UPDATE terms 
SET session_id = (SELECT id FROM academic_sessions ORDER BY created_at DESC LIMIT 1)
WHERE session_id IS NULL AND EXISTS (SELECT 1 FROM academic_sessions);

-- 4. Make session_id NOT NULL for future safety (only if we have sessions)
-- Note: In a fresh DB this might be empty, so we handle with care.
-- For production-intended, we expect at least one session to exist by now or be created.

-- 5. Drop old global unique constraint on order if it exists
-- In migration 003 it was 'terms_order_key'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'terms_order_key') THEN
        ALTER TABLE terms DROP CONSTRAINT terms_order_key;
    END IF;
END $$;

-- 6. Add new composite unique constraints
-- One 'First Term' per session
-- One 'order 1' per session
ALTER TABLE terms ADD CONSTRAINT unique_term_name_per_session UNIQUE (session_id, name);
ALTER TABLE terms ADD CONSTRAINT unique_term_order_per_session UNIQUE (session_id, "order");

-- 7. Ensure only one active term per session
-- Use a partial unique index
DROP INDEX IF EXISTS one_active_term_idx; -- Drop global one
CREATE UNIQUE INDEX one_active_term_per_session_idx ON terms (session_id, is_active) WHERE is_active = true;
