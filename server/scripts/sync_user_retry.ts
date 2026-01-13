
import { supabase } from '../src/config/supabase';

async function syncAndLinkRetry() {
    const email = 'amarachifavour@gmail.com';
    console.log(`Syncing user: ${email}`);

    // 1. Get Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !users) {
        console.error('Failed to list auth users:', authError);
        return;
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
        console.error('User NOT FOUND in Supabase Auth.');
        return;
    }

    console.log('Found Auth ID:', authUser.id);

    // 2. Ensure public.users
    const { data: existingPublic } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

    if (!existingPublic) {
        console.log('Creating missing public.users record...');
        const { data: roles } = await supabase.from('roles').select('id').eq('name', 'teacher').single();

        if (!roles) { console.error('Teacher role not found'); return; }

        const { error: insertError } = await supabase.from('users').insert({
            id: authUser.id,
            email: email,
            role_id: roles.id,
            is_active: true,
            first_name: 'Amarachi',
            last_name: 'Favour'
        });

        if (insertError) {
            console.error('Failed to create public user:', JSON.stringify(insertError, null, 2));
            return;
        }
        console.log('Created public user record.');
    } else {
        console.log('Public user record exists.');
    }

    // 3. Link Teacher Profile
    console.log('Linking teacher profile...');

    // First check if teacher exists and what its current state is
    const { data: teacher, error: teacherCheckError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (!teacher) {
        console.error('Teacher profile not found by email!');
        // Maybe try to create it?
        return;
    }
    console.log('Teacher found, updating link...');

    const { error: linkError } = await supabase
        .from('teachers')
        .update({
            user_id: authUser.id
        })
        .eq('email', email);

    if (linkError) {
        console.error('Link error:', JSON.stringify(linkError, null, 2));
    } else {
        console.log('Teacher linked successfully.');
    }

}

syncAndLinkRetry();
