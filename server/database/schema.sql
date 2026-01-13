-- SCHOOL RESULT MANAGEMENT SYSTEM SCHEMA
-- Designed for Supabase (PostgreSQL)
--
-- GUIDELINES:
-- 1. All Primary Keys are UUIDs.
-- 2. Foreign Keys enforce referential integrity (CASCADE/SET NULL).
-- 3. 'public.users' links to 'auth.users' for security.
-- 4. No triggers or stored procedures (logic kept in app).

-- 1. Enable UUID extension (Standard for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ROLES
-- Static roles for the application
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'admin', 'teacher', 'student', 'parent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USERS (Extends auth.users)
-- Links securely to Supabase's internal auth system
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SESSIONS (Academic Years)
-- e.g., '2025/2026'
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- 5. TERMS
-- Generic terms e.g., 'First Term', 'Second Term'
CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CLASSES
-- e.g., 'JSS 1', 'Grade 10'
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER NOT NULL DEFAULT 0, -- Useful for sorting classes (1, 2, 3...)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SUBJECTS
-- e.g., 'Mathematics', 'English Language'
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE, -- e.g., 'MTH101'
    is_elective BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. STUDENTS
-- Profile information for students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Link to login (optional if students don't look up results themselves yet)
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    current_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    dob DATE,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TEACHERS
-- Profile information for teachers
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- Teachers must have a login
    specialization VARCHAR(100), -- e.g., 'Science'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. GRADING RULES
-- Defines score ranges for grades
CREATE TABLE grading_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    grade VARCHAR(2) NOT NULL, -- 'A', 'B', 'C'
    remark VARCHAR(100), -- 'Distinction', 'Credit'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_score_range CHECK (min_score <= max_score)
);

-- 11. RESULTS
-- The core transactional table
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) NOT NULL, -- Snapshot of class when result was recorded
    term_id UUID REFERENCES terms(id) NOT NULL,
    session_id UUID REFERENCES sessions(id) NOT NULL,
    teacher_id UUID REFERENCES teachers(id), -- The teacher who entered this result
    
    score_ca NUMERIC(5, 2) DEFAULT 0 CHECK (score_ca >= 0), -- Continuous Assessment
    score_exam NUMERIC(5, 2) DEFAULT 0 CHECK (score_exam >= 0), -- Exam Score
    total_score NUMERIC(5, 2) GENERATED ALWAYS AS (score_ca + score_exam) STORED,
    
    grade VARCHAR(2), -- e.g. 'A' (Populated by app logic based on grading_rules)
    remark VARCHAR(100), -- e.g. 'Excellent'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One result per Student per Subject per Term per Session
    CONSTRAINT unique_result_entry UNIQUE (student_id, subject_id, term_id, session_id),
    CONSTRAINT valid_total_score CHECK (total_score <= 100) -- Assuming 100 is max
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_session_term ON results(session_id, term_id);
CREATE INDEX idx_students_class ON students(current_class_id);
CREATE INDEX idx_users_email ON users(email);

-- Comments for Clarity
COMMENT ON TABLE users IS 'Public profile table linked to Supabase Auth';
COMMENT ON TABLE results IS 'Stores academic results. total_score is auto-calculated.';
