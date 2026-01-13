-- Migration 022: Global Auth Integration
-- This migration ensures that all Supabase Auth users have a public profile 
-- and automatically links teacher records by email.

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_id UUID;
    v_teacher_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    -- Determine the role based on email or existing teacher record
    -- 1. Check if they are a teacher
    SELECT id, first_name, last_name INTO v_teacher_id, v_first_name, v_last_name
    FROM public.teachers
    WHERE email = NEW.email;

    IF v_teacher_id IS NOT NULL THEN
        -- It's a teacher!
        SELECT id INTO v_role_id FROM public.roles WHERE name = 'teacher';
    ELSIF NEW.email = 'jessechinedu822@gmail.com' THEN
        -- It's the primary admin!
        SELECT id INTO v_role_id FROM public.roles WHERE name = 'admin';
    ELSE
        -- Default to student
        SELECT id INTO v_role_id FROM public.roles WHERE name = 'student';
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (id, email, first_name, last_name, role_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(v_first_name, SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(v_last_name, 'User'),
        v_role_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role_id = EXCLUDED.role_id;

    -- 3. If it's a teacher, link them
    IF v_teacher_id IS NOT NULL THEN
        UPDATE public.teachers
        SET auth_user_id = NEW.id
        WHERE id = v_teacher_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Retrospective Link: Fix existing unlinked teachers
-- This script only links teachers who already have an entry in auth.users 
-- but weren't linked due to manual creation steps.
DO $$
DECLARE
    auth_rec RECORD;
BEGIN
    FOR auth_rec IN (
        SELECT id, email FROM auth.users
        WHERE email IN (SELECT email FROM public.teachers WHERE auth_user_id IS NULL)
    ) LOOP
        -- Ensure public.users entry exists first
        INSERT INTO public.users (id, email, first_name, last_name, role_id)
        SELECT 
            auth_rec.id, 
            auth_rec.email, 
            t.first_name, 
            t.last_name, 
            (SELECT id FROM public.roles WHERE name = 'teacher')
        FROM public.teachers t
        WHERE t.email = auth_rec.email
        ON CONFLICT (id) DO NOTHING;

        -- Link teacher
        UPDATE public.teachers
        SET auth_user_id = auth_rec.id
        WHERE email = auth_rec.email AND auth_user_id IS NULL;
    END LOOP;
END $$;
