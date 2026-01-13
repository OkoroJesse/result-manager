import { supabase } from './src/config/supabase';

async function checkTables() {
    try {
        console.log('\n--- 📂 DATABASE TABLES CHECK ---');

        // Check academic_sessions
        const { data: acadSessions } = await supabase.from('academic_sessions').select('id, name, is_active');
        console.log('\nTable: academic_sessions');
        if (acadSessions) {
            acadSessions.forEach(s => console.log(`- ${s.name} [${s.id}] Active: ${s.is_active}`));
        } else {
            console.log('Table academic_sessions not found or empty.');
        }

        // Check sessions
        const { data: sessions } = await supabase.from('sessions').select('id, name, is_active');
        console.log('\nTable: sessions');
        if (sessions) {
            sessions.forEach(s => console.log(`- ${s.name} [${s.id}] Active: ${s.is_active}`));
        } else {
            console.log('Table sessions not found or empty.');
        }

        // Check teacher_assignments
        const { data: assignments } = await supabase.from('teacher_assignments').select('academic_session_id').limit(1);
        console.log('\nSample Teacher Assignment Session ID:', assignments?.[0]?.academic_session_id);

    } catch (e) {
        console.error('Check failed:', e);
    }
}
checkTables();
