import { supabase } from './src/config/supabase';

async function verifySessions() {
    try {
        console.log('\n--- SESSION & ASSIGNMENT VERIFICATION ---');

        const { data: sessions } = await supabase.from('sessions').select('id, name, is_active');
        console.log('All Sessions:');
        sessions?.forEach(s => console.log(`- ${s.name} [${s.id}] Active: ${s.is_active}`));

        const { data: teacher } = await supabase.from('teachers').select('id').ilike('last_name', '%Okoro%').single();
        if (teacher) {
            const { data: assignments } = await supabase.from('teacher_assignments').select('*').eq('teacher_id', teacher.id);
            console.log('\nChelsea Assignments:');
            assignments?.forEach(a => {
                console.log(`- Class: ${a.class_id} | Subject: ${a.subject_id} | Session: ${a.academic_session_id} | Active: ${a.is_active}`);
            });
        }

    } catch (e) {
        console.error('Verification failed:', e);
    }
}
verifySessions();
