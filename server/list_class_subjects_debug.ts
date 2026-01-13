import { supabase } from './src/config/supabase';

async function listClassSubjects() {
    try {
        console.log('\n--- CLASS SUBJECTS FOR PRIMARY 5 ---');

        const { data: cls } = await supabase.from('classes').select('id').eq('name', 'Primary 5').single();
        if (!cls) {
            console.log('Class Primary 5 not found');
            return;
        }

        const { data: subjects } = await supabase.from('class_subjects').select(`
            subject_id,
            subjects(id, name)
        `).eq('class_id', cls.id);

        if (!subjects || subjects.length === 0) {
            console.log('No subjects found for this class.');
        } else {
            subjects.forEach((s: any) => {
                console.log(`- Subject: ${s.subjects?.name} (${s.subjects?.id})`);
            });
        }
    } catch (e) {
        console.error('List failed:', e);
    }
}
listClassSubjects();
