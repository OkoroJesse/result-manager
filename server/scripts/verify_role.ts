
import { supabase } from '../src/config/supabase';

async function verifyRole() {
    const email = 'chelsea001@gmail.com';
    console.log(`Verifying role for: ${email}`);

    const { data, error } = await supabase
        .from('users')
        .select(`
            email,
            roles ( name )
        `)
        .eq('email', email)
        .single();

    if (data) {
        // @ts-ignore
        console.log(`User Role is now: ${data.roles?.name}`);
    } else {
        console.error('User not found during verification', error);
    }
}

verifyRole();
