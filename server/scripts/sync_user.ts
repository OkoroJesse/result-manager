
import { supabase } from '../src/config/supabase';

async function syncAndLink() {
    const email = 'amarachifavour@gmail.com';
    console.log(`Syncing user: ${email}`);

    // 1. Get UID from Auth (Supabase Admin)
    // Note: This requires SERVICE_ROLE_KEY to be set in environment for 'supabase.auth.admin' to work fully
    // usually.

    // Actually, supabase-js client exposed as 'supabase' from config might be using service key?
    // Let's try listing users or getting user by email.

    // Note: listUsers is the admin way. 
    // If we don't have admin access on this client, we might be stuck.
    // But let's check.

    // There is no direct "getUserByEmail" on admin API in some versions? 
    // "listUsers" is common. 

    // Let's try a different trick: 
    // We can't easily get the ID if we don't have it.

    // HOWEVER, if the user "added it in supabase auth", they might have the ID.
    // But I can't ask them easily.

    // Let's assume the server environment DOES have service role privileges (it should).

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !users) {
        console.error('Failed to list auth users:', authError);
        return;
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
        console.error('User NOT FOUND in Supabase Auth layer either.');
        return;
    }

    console.log('Found Auth ID:', authUser.id);

    // 2. Create/Ensure public.users record
    const { data: existingPublic, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

    if (!existingPublic) {
        console.log('Creating missing public.users record...');
        // We need a role ID for 'teacher'
        const { data: roles } = await supabase.from('roles').select('*').eq('name', 'teacher').single();

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
            console.error('Failed to create public user:', insertError);
            return;
        }
        console.log('Created public user record.');
    } else {
        console.log('Public user record exists (unexpectedly?).');
    }

    // 3. Link Teacher Profile
    console.log('Linking teacher profile...');
    const { error: linkError } = await supabase
        .from('teachers')
        .update({
            user_id: authUser.id,
            first_name: 'Amarachi',
            last_name: 'Favour'
        })
        .eq('email', email);

    if (linkError) console.error('Link error:', linkError);
    else console.log('Teacher linked successfully.');

}

syncAndLink();
