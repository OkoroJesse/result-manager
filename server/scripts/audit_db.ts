
import { supabase } from '../src/config/supabase';

async function auditClasses() {
    console.log('Auditing classes table...');

    // Check columns by selecting one row
    const { data, error } = await supabase.from('classes').select('*').limit(1);

    if (error) {
        console.error('Error fetching classes:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]).join(', '));
        console.log('First row level:', data[0].level, 'Type:', typeof data[0].level);
    } else {
        console.log('Classes table is empty.');
    }
}

auditClasses();
