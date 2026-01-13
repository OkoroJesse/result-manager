
import { supabase } from '../src/config/supabase';

async function seedAssignments() {
    console.log('Seeding assignments for Primary 1...');

    // Get Primary 1
    const { data: p1 } = await supabase.from('classes').select('id').ilike('name', '%primary 1%').single();
    if (!p1) {
        console.error('Primary 1 not found!');
        return;
    }

    // Get Primary Subjects
    const { data: subjects } = await supabase.from('subjects').select('id').eq('level', 'PRIMARY');
    if (!subjects || subjects.length === 0) {
        console.error('No PRIMARY subjects found!');
        return;
    }

    // Assign
    const updates = subjects.map(s => ({
        class_id: p1.id,
        subject_id: s.id
    }));

    const { error } = await supabase.from('class_subjects').upsert(updates, { onConflict: 'class_id,subject_id' });

    if (error) {
        console.error('Error assigning:', error);
    } else {
        console.log(`Successfully assigned ${subjects.length} subjects to Primary 1.`);
    }

    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
    console.log(`Current Student Count: ${count}`);
}

seedAssignments();
