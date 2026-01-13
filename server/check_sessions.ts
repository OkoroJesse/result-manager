import { supabase } from './src/config/supabase';

async function checkSessions() {
    console.log('Checking academic_sessions table...');

    try {
        const { data, error } = await supabase
            .from('academic_sessions')
            .select('*')
            .limit(1);

        if (error) {
            console.log('Error selecting from academic_sessions:', error.message);
        } else {
            console.log('Successfully selected from academic_sessions.');
            if (data && data.length > 0) {
                console.log('Columns found:', Object.keys(data[0]));
            } else {
                console.log('Table exists but is empty.');
            }
        }
    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkSessions();
