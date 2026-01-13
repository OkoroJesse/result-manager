
import { supabase } from '../src/config/supabase';

async function linkTeacher() {
    console.log('Linking Amarachi...');

    const email = 'amarachifavour@gmail.com';

    // 1. Get User ID
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('Found User ID:', user.id);

    // 2. Update Teacher Record
    // Note: The column might be 'user_id' or 'auth_user_id' depending on schema evolution.
    // Based on previous script output `user_id: undefined`, it might be just `user_id` in the types
    // but let's check the schema? The inspect script logged `user_id: undefined` so the column is likely named `user_id`
    // Wait, let me double check the previous output.
    // The previous output object keys were logged? No, I logged explicit object.

    // I will try 'user_id' first.
    const { error: linkError } = await supabase
        .from('teachers')
        .update({ user_id: user.id })
        .eq('email', email);

    if (linkError) {
        console.error('Link failed:', linkError);
    } else {
        console.log('Successfully linked teacher profile to auth user.');
    }
}

linkTeacher();
