
import { supabase } from '../src/config/supabase';

async function syncUserFinal() {
    const email = 'amarachifavour@gmail.com';
    console.log(`Final Sync Attempt for: ${email}`);

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

    // 2. Update Teacher Profile
    const { error: linkError } = await supabase
        .from('teachers')
        .update({ user_id: authUser.id })
        .eq('email', email);

    if (linkError) {
        console.error('Link error:', JSON.stringify(linkError, null, 2));
    } else {
        console.log('Teacher linked successfully.');
    }

    // 3. Double Check
    const { data: teacher } = await supabase.from('teachers').select('user_id').eq('email', email).single();
    console.log('Verification state:', teacher);
}

syncUserFinal();
