-- Migration 029: Row Level Security (RLS) Lockdown
-- This migration re-enables RLS on all core tables and implements 
-- granular access control policies for Admins, Teachers, and Students.

-- 1. Helper Functions for Policies
-- These securely fetch the current user's role and associated IDs from public.users

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT r.name FROM public.roles r
  JOIN public.users u ON u.role_id = r.id
  WHERE u.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM public.teachers WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.students WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. ENABLE RLS ON ALL TABLES
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL EXISTING POLICIES (TO START FRESH)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;

-------------------------------------------------------------------------------
-- 4. GLOBAL ADMIN POLICIES
-------------------------------------------------------------------------------
-- Admins have full access to everything
DO $$ 
DECLARE 
  t TEXT;
BEGIN
  FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'CREATE POLICY "Admins full access" ON ' || quote_ident(t) || 
            ' FOR ALL TO authenticated USING (public.get_user_role() = ''admin'')';
  END LOOP;
END $$;

-------------------------------------------------------------------------------
-- 5. TEACHER POLICIES
-------------------------------------------------------------------------------

-- Teachers can READ academic setup
CREATE POLICY "Teachers read sessions" ON sessions FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');
CREATE POLICY "Teachers read terms" ON terms FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');
CREATE POLICY "Teachers read classes" ON classes FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');
CREATE POLICY "Teachers read subjects" ON subjects FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');
CREATE POLICY "Teachers read grading_rules" ON grading_rules FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');

-- Teachers can READ all students (to enter results)
CREATE POLICY "Teachers read students" ON students FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');

-- Teachers can READ and MANAGE results ONLY for their assigned class/subject
CREATE POLICY "Teachers manage assigned results" ON results FOR ALL TO authenticated 
USING (
  public.get_user_role() = 'teacher' AND
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    WHERE ta.teacher_id = public.get_teacher_id()
    AND ta.class_id = results.class_id
    AND ta.subject_id = results.subject_id
    AND ta.is_active = true
  )
)
WITH CHECK (
  public.get_user_role() = 'teacher' AND
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    WHERE ta.teacher_id = public.get_teacher_id()
    AND ta.class_id = results.class_id
    AND ta.subject_id = results.subject_id
    AND ta.is_active = true
  )
);

-- Teachers can view their own assignments
CREATE POLICY "Teachers view own assignments" ON teacher_assignments FOR SELECT TO authenticated 
USING (public.get_user_role() = 'teacher' AND teacher_id = public.get_teacher_id());

-- Teachers can view their own profile and other teachers
CREATE POLICY "Teachers view teacher directory" ON teachers FOR SELECT TO authenticated 
USING (public.get_user_role() = 'teacher');

-- Teachers can view user profiles (limited to basic info needed for UI)
CREATE POLICY "Teachers view user profiles" ON users FOR SELECT TO authenticated 
USING (public.get_user_role() = 'teacher');

-------------------------------------------------------------------------------
-- 6. STUDENT POLICIES
-------------------------------------------------------------------------------

-- Students can READ their own profile
CREATE POLICY "Students read own student record" ON students FOR SELECT TO authenticated 
USING (public.get_user_role() = 'student' AND id = public.get_student_id());

CREATE POLICY "Students read own user record" ON users FOR SELECT TO authenticated 
USING (public.get_user_role() = 'student' AND id = auth.uid());

-- Students can READ academic setup (for finding their context)
CREATE POLICY "Students read sessions" ON sessions FOR SELECT TO authenticated USING (public.get_user_role() = 'student');
CREATE POLICY "Students read terms" ON terms FOR SELECT TO authenticated USING (public.get_user_role() = 'student');
CREATE POLICY "Students read classes" ON classes FOR SELECT TO authenticated USING (public.get_user_role() = 'student');
CREATE POLICY "Students read subjects" ON subjects FOR SELECT TO authenticated USING (public.get_user_role() = 'student');

-- Students can READ ONLY their own APPROVED results
CREATE POLICY "Students read own approved results" ON results FOR SELECT TO authenticated 
USING (
  public.get_user_role() = 'student' AND 
  student_id = public.get_student_id() AND 
  status = 'approved'
);

-------------------------------------------------------------------------------
-- 7. CLEANUP / SAFETY
-------------------------------------------------------------------------------
-- Ensure the 'rejected' status is allowed (re-check)
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_status_check;
ALTER TABLE results ADD CONSTRAINT results_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

-- Update updated_at trigger if needed (logic usually in app, but RLS ensures only app can write)
