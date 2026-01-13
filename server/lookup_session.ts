import { supabase } from './src/config/supabase';

async function findSession() {
    const targetId = 'c049b725-53b5-402b-9ec6-02ebab318254';
    console.log(`\nSearching for Session ID: ${targetId}`);

    const { data: session } = await supabase.from('sessions').select('*').eq('id', targetId).maybeSingle();
    if (session) {
        console.log('Found Session:', session);
    } else {
        console.log('Session NOT FOUND in database!');
    }

    const { data: activeSession } = await supabase.from('sessions').select('*').eq('is_active', true).maybeSingle();
    console.log('Current Active Session in DB:', activeSession);
}
findSession();
