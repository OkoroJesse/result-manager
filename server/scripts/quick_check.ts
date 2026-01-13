
import { supabase } from '../src/config/supabase';

async function quickCheck() {
    const { count: classes } = await supabase.from('classes').select('*', { count: 'exact', head: true });
    const { count: subjects } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
    const { count: assignments } = await supabase.from('class_subjects').select('*', { count: 'exact', head: true });
    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true });

    console.log(`Classes: ${classes}`);
    console.log(`Subjects: ${subjects}`);
    console.log(`Assignments: ${assignments}`);
    console.log(`Students: ${students}`);

    const { data: p1 } = await supabase.from('classes').select('id').ilike('name', '%primary 1%').single();
    if (p1) {
        const { count: p1Ass } = await supabase.from('class_subjects').select('*', { count: 'exact', head: true }).eq('class_id', p1.id);
        console.log(`Primary 1 Assignments: ${p1Ass}`);
    } else {
        console.log('Primary 1 class not found');
    }
}

quickCheck();
