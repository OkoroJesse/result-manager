
import { supabase } from '../src/config/supabase';

async function syncUserCorrect() {
    const email = 'amarachifavour@gmail.com';
    console.log(`Correct Sync for: ${email}`);

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

    // 2. Update Teacher Profile (auth_user_id)
    const { error: linkError } = await supabase
        .from('teachers')
        .update({ auth_user_id: authUser.id })
        .eq('email', email);

    if (linkError) {
        console.error('Link error:', JSON.stringify(linkError, null, 2));
    } else {
        console.log('Teacher linked successfully using auth_user_id.');
    }

    // 3. Ensure public.users has usage of role 'teacher'
    // (This part also used `role_id` which might be correct in `public.users` depending on schema)
    // `public.users` typically has `role_id` FK.
    // Let's check public.users?
    // We'll skip that for now, assuming standard flow managed it, or 022 trigger did it but failed teacher update.
}

syncUserCorrect();
