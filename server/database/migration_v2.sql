-- MIGRATION: Result Entry Requirements
-- Run this in Supabase SQL Editor

-- 1. Create Teacher Assignments Table
CREATE TABLE teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_assignment UNIQUE (teacher_id, class_id, subject_id)
);

-- 2. Update Results Table
-- Add score_test, status
ALTER TABLE results ADD COLUMN score_test NUMERIC(5, 2) DEFAULT 0 CHECK (score_test >= 0);
ALTER TABLE results ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));

-- Update Total Score Generation Logic
-- Postgres (12+) supports altering generated columns? Sometimes tricky.
-- Safest involves dropping and re-adding.
ALTER TABLE results DROP COLUMN total_score;
ALTER TABLE results ADD COLUMN total_score NUMERIC(5, 2) 
GENERATED ALWAYS AS (score_ca + score_test + score_exam) STORED;

ALTER TABLE results ADD CONSTRAINT valid_total_score_new CHECK (total_score <= 100);

-- Index for Assignments
CREATE INDEX idx_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_assignments_composite ON teacher_assignments(class_id, subject_id);
