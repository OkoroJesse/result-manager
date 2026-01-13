import { supabase } from './src/config/supabase';

async function fetchTeacher() {
    console.log('--- Fetching Teacher Credentials ---');

    // 1. Get Role ID for 'teacher'
    const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'teacher')
        .single();

    if (roleError) {
        console.error('Error fetching role:', roleError);
        return;
    }

    console.log('Teacher Role ID:', roles.id);

    // 2. Get a user with this role
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('email, first_name, last_name, id')
        .eq('role_id', roles.id)
        .limit(1);

    if (userError) {
        console.error('Error fetching user:', userError);
        return;
    }

    if (users && users.length > 0) {
        console.log('Found Teacher:', users[0]);
    } else {
        console.log('No teacher found. You need to create one.');
    }
}

fetchTeacher();
