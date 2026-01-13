import { supabase } from './src/config/supabase';

async function checkSchema() {
    console.log('--- Checking Users Table Schema ---');

    // We can't easily desc table via client, but we can try to select * from users limit 1
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        if (data && data.length > 0) {
            console.log('User columns:', Object.keys(data[0]));
        } else {
            console.log('No users found to infer schema, trying to select specific column...');
            const { error: colError } = await supabase.from('users').select('profile_picture_url').limit(1);
            if (colError) console.log('Column profile_picture_url likely DOES NOT exist:', colError.message);
            else console.log('Column profile_picture_url EXISTS.');
        }
    }
}

checkSchema();
