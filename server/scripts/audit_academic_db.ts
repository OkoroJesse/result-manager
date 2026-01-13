
import { supabase } from '../src/config/supabase';

async function auditAcademicTables() {
    console.log('Auditing academic tables...');

    // Check sessions
    // Using loose query to see what columns come back
    const { data: sessions, error: sessionError } = await supabase.from('sessions').select('*').limit(1);

    if (sessionError) {
        console.error('Error fetching sessions:', sessionError);
        // Maybe table is named academic_sessions?
        const { data: acSessions, error: acError } = await supabase.from('academic_sessions').select('*').limit(1);
        if (acError) console.log('academic_sessions also failed');
        else if (acSessions && acSessions.length > 0) console.log('academic_sessions columns:', Object.keys(acSessions[0]));
        else console.log('academic_sessions table exists (empty)');
    } else {
        if (sessions && sessions.length > 0) console.log('sessions columns:', Object.keys(sessions[0]));
        else console.log('sessions table exists (empty)');
    }

    // Check terms
    const { data: terms, error: termError } = await supabase.from('terms').select('*').limit(1);
    if (termError) {
        console.error('Error fetching terms:', termError);
    } else {
        if (terms && terms.length > 0) console.log('terms columns:', Object.keys(terms[0]));
        else console.log('terms table exists (empty)');
    }
}

auditAcademicTables();
