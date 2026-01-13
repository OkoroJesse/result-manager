
import { supabase } from '../src/config/supabase';

async function auditResultsTable() {
    console.log('Auditing results table...');
    const { data, error } = await supabase.from('results').select('*').limit(1);

    if (error) {
        console.error('Error fetching results:', error);
    } else {
        if (data && data.length > 0) {
            console.log('results columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('results table exists (empty)');
            // Try to deduce structure by inserting a dummy fail or checking pg_meta if possible (not easy here).
            // We'll rely on migrations history or just assume we need to ALTER to match requirements.
        }
    }
}

auditResultsTable();
