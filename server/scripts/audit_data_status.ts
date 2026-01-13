
import { supabase } from '../src/config/supabase';

async function auditData() {
    console.log('--- AUDIT START ---');

    // 1. Check Classes
    const { data: classes } = await supabase.from('classes').select('id, name, level');
    console.log(`Classes found: ${classes?.length}`);
    if (classes) classes.forEach(c => console.log(` - ${c.name} (${c.level}) [${c.id}]`));

    // 2. Check Subjects
    const { data: subjects } = await supabase.from('subjects').select('id, name, level');
    console.log(`\nSubjects found: ${subjects?.length}`);
    if (subjects && subjects.length < 10) subjects.forEach(s => console.log(` - ${s.name} (${s.level})`));

    // 3. Check Class Assignments
    const { data: assignments } = await supabase.from('class_subjects').select('class_id, subject_id');
    console.log(`\nClass Assignments found: ${assignments?.length}`);

    // Check assignments for "Primary 1" specifically if it exists
    const p1 = classes?.find(c => c.name.toLowerCase().includes('primary 1'));
    if (p1) {
        const p1Assignments = assignments?.filter(a => a.class_id === p1.id);
        console.log(`Assignments for Primary 1: ${p1Assignments?.length}`);
    }

    // 4. Check Students
    const { data: students, error: studentError } = await supabase.from('students').select(`
        id, 
        admission_number, 
        current_class_id,
        users (first_name, last_name)
    `);

    if (studentError) {
        console.error('Error fetching students:', studentError);
    } else {
        console.log(`\nStudents found: ${students?.length}`);
        students?.forEach(s => {
            // @ts-ignore
            const name = s.users ? `${s.users.first_name} ${s.users.last_name}` : 'Unknown User';
            console.log(` - ${name} (${s.admission_number})`);
        });
    }

    console.log('--- AUDIT END ---');
}

auditData();
