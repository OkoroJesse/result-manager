-- MIGRATION: Subjects Module

-- 1. Alter subjects table to add new columns
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'PRIMARY'; -- Enum simulation
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure name+level uniqueness (so Math for PRI is diff from Math for SSS)
-- First drop existing name constraint if it exists broadly, or we add a new composite one
-- We'll try to add the composite one. If name alone was unique, we might need to drop that constraint first.
-- Assuming 'subjects_name_key' exists from previous/default setups.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subjects_name_key') THEN
        ALTER TABLE subjects DROP CONSTRAINT subjects_name_key;
    END IF;
END $$;

ALTER TABLE subjects ADD CONSTRAINT subjects_name_level_key UNIQUE (name, level);

-- 2. Create class_subjects table (Many-to-Many)
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, subject_id)
);

-- 3. Seed Default Subjects (Safe Inserts)
-- Helper function to insert if not exists
DO $$
DECLARE
    s_name text;
    s_level text;
BEGIN
    -- PRIMARY
    FOR s_name IN SELECT unnest(ARRAY['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education']) LOOP
        INSERT INTO subjects (name, level, is_active) VALUES (s_name, 'PRIMARY', true) ON CONFLICT (name, level) DO NOTHING;
    END LOOP;

    -- JSS
    FOR s_name IN SELECT unnest(ARRAY['Mathematics', 'English Language', 'Basic Science', 'Business Studies', 'Intro Technology']) LOOP
        INSERT INTO subjects (name, level, is_active) VALUES (s_name, 'JSS', true) ON CONFLICT (name, level) DO NOTHING;
    END LOOP;

    -- SSS
    FOR s_name IN SELECT unnest(ARRAY['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Technical Drawing']) LOOP
        INSERT INTO subjects (name, level, is_active) VALUES (s_name, 'SSS', true) ON CONFLICT (name, level) DO NOTHING;
    END LOOP;
END $$;
