-- TEACHERS MODULE MIGRATION

-- 1. Create Teachers Table
-- This profile table links strict 1:1 with auth.users
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    staff_id VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Teacher Assignments Table
-- Links a teacher to a specific Class AND Subject pair.
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- Admin who assigned
    
    -- Prevent duplicate assignment of same subject in same class to same teacher
    UNIQUE(teacher_id, class_id, subject_id)
);

-- 3. Row Level Security (RLS) policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view/edit everything.
-- Policy: Teachers can view THEIR OWN profile and assignments.
-- Policy: Students cannot access this data directly (usually).

-- For Development (Broad Access - Refine later)
CREATE POLICY "Enable all for authenticated users" ON teachers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON teacher_assignments FOR ALL USING (auth.role() = 'authenticated');

-- 4. Audit / Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
