import { supabase } from './src/config/supabase';

async function testAssignment() {
    console.log('--- Testing Class-Subject Assignment ---');

    // 1. Get a class
    const { data: classes } = await supabase.from('classes').select('id, name').limit(1);
    if (!classes || classes.length === 0) {
        console.error('No classes found!');
        return;
    }
    const classId = classes[0].id;
    console.log(`Using class: ${classes[0].name} (${classId})`);

    // 2. Get a subject
    const { data: subjects } = await supabase.from('subjects').select('id, name').eq('status', 'active').limit(1);
    if (!subjects || subjects.length === 0) {
        console.error('No active subjects found!');
        return;
    }
    const subjectId = subjects[0].id;
    console.log(`Using subject: ${subjects[0].name} (${subjectId})`);

    // 3. Try to assign
    console.log('\nAttempting assignment...');
    const { data, error } = await supabase
        .from('class_subjects')
        .insert({
            class_id: classId,
            subject_id: subjectId,
            is_compulsory: true
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Assignment FAILED!');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
    } else {
        console.log('✅ Assignment SUCCESS!');
        console.log('Assignment ID:', data.id);
    }
}

testAssignment();
