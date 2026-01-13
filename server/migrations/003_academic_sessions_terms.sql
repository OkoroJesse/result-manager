-- MIGRATION: Academic Sessions and Terms

-- 1. Create academic_sessions if not exists
CREATE TABLE IF NOT EXISTS academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist
ALTER TABLE academic_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE academic_sessions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE academic_sessions ADD COLUMN IF NOT EXISTS end_date DATE;

-- Ensure Name Unique Constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_sessions_name_key') THEN
        -- Check if there's already a unique index on 'name' via other means or just add it
        -- Safest is to try adding it with a specific name, if duplicates exist this will fail and user needs to fix data
        ALTER TABLE academic_sessions ADD CONSTRAINT academic_sessions_name_key UNIQUE (name);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint might already exist with different name? 
        NULL;
    WHEN others THEN
        -- If data is duplicate, let it fail so user sees it
        RAISE NOTICE 'Could not add unique constraint on academic_sessions.name: %', SQLERRM;
        RAISE;
END $$;


-- 2. Create terms if not exists
CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    "order" INT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist
ALTER TABLE terms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE terms ADD COLUMN IF NOT EXISTS "order" INT;

-- Ensure Order Unique Constraint (Critical for ON CONFLICT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'terms_order_key') THEN
        ALTER TABLE terms ADD CONSTRAINT terms_order_key UNIQUE ("order");
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add unique constraint on terms.order: %', SQLERRM;
        -- Don't raise, maybe the constraint exists with a different name?
        -- But ON CONFLICT depends on it. 
        -- If we cannot match the constraint name, we should rely on the COLUMN in conflict, which works if ANY unique index covers it.
        RAISE;
END $$;


-- 3. Constraints for Single Active Entity
DROP INDEX IF EXISTS one_active_session_idx;
CREATE UNIQUE INDEX one_active_session_idx ON academic_sessions (is_active) WHERE is_active = true;

DROP INDEX IF EXISTS one_active_term_idx;
CREATE UNIQUE INDEX one_active_term_idx ON terms (is_active) WHERE is_active = true;

-- 4. Seed Default Terms
INSERT INTO terms (name, "order", is_active) VALUES
('First Term', 1, false),
('Second Term', 2, false),
('Third Term', 3, false)
-- Now that we ensured a UNIQUE constraint on "order", this should work. 
-- However, if the constraint name is different, postgres still matches the column.
ON CONFLICT ("order") DO NOTHING;

-- 5. Seed an initial Session if empty
INSERT INTO academic_sessions (name, is_active)
SELECT '2023/2024', false
WHERE NOT EXISTS (SELECT 1 FROM academic_sessions);

-- 6. Safely add columns to results table if they don't exist
ALTER TABLE results ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES academic_sessions(id);
ALTER TABLE results ADD COLUMN IF NOT EXISTS term_id UUID REFERENCES terms(id);
