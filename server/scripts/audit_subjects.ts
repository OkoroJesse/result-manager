
import { supabase } from '../src/config/supabase';

async function auditSubjects() {
    console.log('Auditing subjects table...');
    const { data, error } = await supabase.from('subjects').select('*').limit(1);

    if (error) {
        console.error('Error fetching subjects:', error);
    } else {
        if (data && data.length > 0) {
            console.log('subjects columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('subjects table exists (empty)');
        }
    }

    console.log('Auditing class_subjects table...');
    const { data: cs, error: csError } = await supabase.from('class_subjects').select('*').limit(1);

    if (csError) {
        console.error('Error fetching class_subjects:', csError);
    } else {
        if (cs && cs.length > 0) {
            console.log('class_subjects columns:', Object.keys(cs[0]).join(', '));
        } else {
            console.log('class_subjects table exists (empty)');
        }
    }
}

auditSubjects();
