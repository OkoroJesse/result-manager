-- Migration 030: Academic Lifecycle & Data Integrity
-- Implementation of Student Promotion History and Term Closing constraints.

-- 1. STUDENT CLASS HISTORY
-- Tracks every class a student has been in across different sessions.
CREATE TABLE public.student_class_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'promoted' CHECK (status IN ('promoted', 'repeated', 'withdrawn', 'admitted')),
    promoted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: A student should only have one history record per session.
    CONSTRAINT unique_student_session_history UNIQUE (student_id, session_id)
);

-- 2. ACADEMIC PROMOTIONS (AUDIT LOG)
-- Logs batch promotion actions performed by admins.
CREATE TABLE public.academic_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_from_id UUID REFERENCES public.sessions(id) NOT NULL,
    session_to_id UUID REFERENCES public.sessions(id) NOT NULL,
    class_from_id UUID REFERENCES public.classes(id) NOT NULL,
    class_to_id UUID REFERENCES public.classes(id) NOT NULL,
    student_count INTEGER NOT NULL,
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENFORCE IMMUTABILITY FOR CLOSED TERMS
-- Add a constraint or trigger to prevent results modification if term is closed.

CREATE OR REPLACE FUNCTION public.fn_prevent_closed_term_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the term associated with the result is closed
    IF EXISTS (
        SELECT 1 FROM public.terms 
        WHERE id = COALESCE(NEW.term_id, OLD.term_id) 
        AND status = 'closed'
    ) THEN
        RAISE EXCEPTION 'Action Denied: This term has been CLOSED and results are now immutable.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_closed_term_results ON public.results;
CREATE TRIGGER trigger_prevent_closed_term_results
    BEFORE UPDATE OR DELETE ON public.results
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_prevent_closed_term_modification();

-- 4. ENABLE RLS ON NEW TABLES
ALTER TABLE public.student_class_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_promotions ENABLE ROW LEVEL SECURITY;

-- 5. APPLY POLICIES

-- Admin: Full Access
CREATE POLICY "Admins full access on history" ON public.student_class_history 
FOR ALL TO authenticated USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins full access on promotions" ON public.academic_promotions 
FOR ALL TO authenticated USING (public.get_user_role() = 'admin');

-- Teachers: Read-only access to history
CREATE POLICY "Teachers read student history" ON public.student_class_history 
FOR SELECT TO authenticated USING (public.get_user_role() = 'teacher');

-- Students: Read own history
CREATE POLICY "Students read own history" ON public.student_class_history 
FOR SELECT TO authenticated 
USING (public.get_user_role() = 'student' AND student_id = public.get_student_id());

-- 6. INDEXES
CREATE INDEX idx_history_student ON public.student_class_history(student_id);
CREATE INDEX idx_history_session ON public.student_class_history(session_id);
CREATE INDEX idx_promotions_sessions ON public.academic_promotions(session_from_id, session_to_id);
