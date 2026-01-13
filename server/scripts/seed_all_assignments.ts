
import { supabase } from '../src/config/supabase';

async function seedAllAssignments() {
    console.log('--- SEEDING ALL CLASS ASSIGNMENTS ---');

    // 1. Fetch Resources
    const { data: classes } = await supabase.from('classes').select('id, name, level');
    const { data: subjects } = await supabase.from('subjects').select('id, level');

    if (!classes || !subjects) {
        console.error('Failed to fetch classes or subjects.');
        return;
    }

    console.log(`Found ${classes.length} classes and ${subjects.length} subjects.`);

    const updates: { class_id: string, subject_id: string }[] = [];

    // 2. Map Assignments
    for (const cls of classes) {
        // Determine subject level based on class level
        // My DB has 'PRI', 'JSS', 'SSS' for class levels (from schema inspection or assumption)
        // Subjects have 'PRIMARY', 'JSS', 'SSS'

        let targetSubjectLevel = '';
        if (cls.level === 'PRI') targetSubjectLevel = 'PRIMARY';
        else if (cls.level === 'JSS') targetSubjectLevel = 'JSS';
        else if (cls.level === 'SSS') targetSubjectLevel = 'SSS';

        // Fallback for case sensitivity or slight mismatch
        if (!targetSubjectLevel) {
            if (cls.name.toLowerCase().includes('primary')) targetSubjectLevel = 'PRIMARY';
            else if (cls.name.toLowerCase().includes('jss')) targetSubjectLevel = 'JSS';
            else if (cls.name.toLowerCase().includes('ss')) targetSubjectLevel = 'SSS';
        }

        if (targetSubjectLevel) {
            const relevantSubjects = subjects.filter(s => s.level === targetSubjectLevel);

            relevantSubjects.forEach(subj => {
                updates.push({
                    class_id: cls.id,
                    subject_id: subj.id
                });
            });
            console.log(`Prepared ${relevantSubjects.length} assignments for ${cls.name}`);
        } else {
            console.warn(`Could not determine subject level for class: ${cls.name} (${cls.level})`);
        }
    }

    // 3. Perform Upsert
    if (updates.length > 0) {
        // Batch in chunks if huge, but here ~1000 is fine
        const { error } = await supabase.from('class_subjects').upsert(updates, { onConflict: 'class_id,subject_id' });

        if (error) {
            console.error('Error saving assignments:', error);
        } else {
            console.log(`SUCCESS: Created/Updated ${updates.length} assignments across all classes.`);
        }
    } else {
        console.log('No assignments to make.');
    }
}

seedAllAssignments();
