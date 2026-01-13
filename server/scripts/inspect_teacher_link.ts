
import { supabase } from '../src/config/supabase';

async function inspectTeacherLink() {
    const email = 'amarachifavour@gmail.com';
    console.log(`Inspecting for: ${email}`);

    // 1. Check Auth User (public.users)
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (user) {
        console.log('Auth User Found:', { id: user.id, email: user.email, role: user.role_id });
    } else {
        console.log('Auth User NOT FOUND in public.users');
    }

    // 2. Check Teacher Profile
    const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (teacher) {
        console.log('Teacher Profile Found:', {
            id: teacher.id,
            email: teacher.email,
            user_id: teacher.user_id, // This is the link
            linked_status: teacher.user_id ? 'LINKED' : 'UNLINKED'
        });
    } else {
        console.log('Teacher Profile NOT FOUND');
    }

    // 3. Scan for any teacher with this email? (Done above)
}

inspectTeacherLink();
