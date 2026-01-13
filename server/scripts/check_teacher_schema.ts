import { supabase } from '../src/config/supabase';

async function checkSchema() {
    try {
        console.log('--- Checking Teachers Table ---');
        const { data: teacherData, error: teacherError } = await supabase.from('teachers').select('*').limit(1);
        if (teacherError) {
            console.error('Teachers Table Error:', teacherError);
        } else if (teacherData && teacherData.length > 0) {
            console.log('TEACHER_COLUMNS:', Object.keys(teacherData[0]));
        } else {
            console.log('TEACHER_TABLE_EMPTY');
        }

        console.log('\n--- Checking Teacher Assignments Table ---');
        const { data: assignData, error: assignError } = await supabase.from('teacher_assignments').select('*').limit(1);
        if (assignError) {
            console.error('Teacher Assignments Table Error:', assignError);
        } else if (assignData && assignData.length > 0) {
            console.log('ASSIGNMENT_COLUMNS:', Object.keys(assignData[0]));
        } else {
            console.log('ASSIGNMENT_TABLE_EMPTY');
        }

    } catch (err) {
        console.error('GLOBAL_ERROR:', err);
    }
}

checkSchema();
