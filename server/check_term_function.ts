import { supabase } from './src/config/supabase';

async function checkTermFunction() {
    console.log('Checking fn_activate_term RPC function...');

    try {
        const { error } = await supabase.rpc('fn_activate_term', { target_term_id: '00000000-0000-0000-0000-000000000000' });
        console.log('fn_activate_term exists:', error?.code !== 'PGRST202');
        if (error) console.log('Error Details - Code:', error.code, 'Message:', error.message);
    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkTermFunction();
