import { supabase } from './src/config/supabase';

async function debug() {
    try {
        console.log('\n--- 🔍 BROAD SUBMISSION DEBUG ---');

        // 1. Teacher
        const { data: teacher } = await supabase.from('teachers').select('*').ilike('last_name', '%Okoro%').single();
        console.log(`Teacher Chelsea: ${teacher?.id}`);

        // 2. All Assignments for Chelsea
        console.log('\n--- 📂 ALL Assignments for Chelsea ---');
        const { data: assignments } = await supabase.from('teacher_assignments').select(`
            *,
            classes(name),
            subjects(name)
        `).eq('teacher_id', teacher.id);

        assignments?.forEach(a => {
            console.log(`- Class: ${a.classes.name} (${a.class_id})`);
            console.log(`  Subject: ${a.subjects.name} (${a.subject_id})`);
            console.log(`  Session: ${a.academic_session_id}`);
            console.log(`  Active: ${a.is_active}`);
        });

        // 3. All Results for Primary 5
        const { data: cls } = await supabase.from('classes').select('id, name').eq('name', 'Primary 5').single();
        console.log(`\n--- 📝 ALL Results for ${cls.name} ---`);
        const { data: results } = await supabase.from('results').select(`
            id,
            student_id,
            subject_id,
            session_id,
            term_id,
            status,
            entered_by
        `).eq('class_id', cls.id);

        console.log(`Found ${results?.length || 0} results total for this class.`);
        if (results && results.length > 0) {
            results.forEach(r => {
                console.log(`- Result ID: ${r.id}`);
                console.log(`  Student: ${r.student_id}`);
                console.log(`  Subject: ${r.subject_id}`);
                console.log(`  Session: ${r.session_id}`);
                console.log(`  Term: ${r.term_id}`);
                console.log(`  Status: ${r.status}`);
                console.log(`  Entered By: ${r.entered_by}`);
                console.log('---');
            });
        }

        console.log('\n--- DEBUG COMPLETE ---\n');

    } catch (e) {
        console.error('Debug failed:', e);
    }
}
debug();
