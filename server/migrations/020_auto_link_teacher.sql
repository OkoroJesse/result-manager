
-- Migration: Auto-link Teachers on Signup
-- Create a function to be called on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user_teacher_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a teacher profile exists with this email
  UPDATE public.teachers
  SET user_id = NEW.id
  WHERE email = NEW.email;
  
  -- Also ensure public.users record exists (idempotent)
  INSERT INTO public.users (id, email, first_name, last_name, role_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'first_name', 
    NEW.raw_user_meta_data->>'last_name',
    (SELECT id FROM public.roles WHERE name = 'teacher') -- Default to teacher if they are in teachers table?
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created_link_teacher ON auth.users;
CREATE TRIGGER on_auth_user_created_link_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_teacher_link();
