import { supabase } from './src/config/supabase';

async function listResults() {
    try {
        console.log('\n--- LISTING RESULTS FOR PRIMARY 5 ---');

        const { data: cls } = await supabase.from('classes').select('id').eq('name', 'Primary 5').single();
        if (!cls) {
            console.log('Class Primary 5 not found');
            return;
        }

        const { data: results } = await supabase.from('results').select('*').eq('class_id', cls.id);

        if (!results || results.length === 0) {
            console.log('No results found for this class.');
        } else {
            console.log(`Found ${results.length} results.`);
            results.forEach(r => {
                console.log(`- ID: ${r.id} | Student: ${r.student_id} | Subject: ${r.subject_id} | Session: ${r.session_id} | Term: ${r.term_id}`);
            });
        }
    } catch (e) {
        console.error('List failed:', e);
    }
}
listResults();
