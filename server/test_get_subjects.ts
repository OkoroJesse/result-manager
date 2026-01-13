import { supabase } from './src/config/supabase';

async function testGetClassSubjects() {
    console.log('--- Testing Get Class Subjects ---');

    // 1. Get a class
    const { data: classes } = await supabase.from('classes').select('id, name').limit(1);
    if (!classes || classes.length === 0) {
        console.error('No classes found!');
        return;
    }
    const classId = classes[0].id;
    console.log(`Using class: ${classes[0].name} (${classId})`);

    // 2. Check class_subjects table directly
    console.log('\n--- Direct query to class_subjects ---');
    const { data: rawData, error: rawError } = await supabase
        .from('class_subjects')
        .select('*')
        .eq('class_id', classId);

    if (rawError) {
        console.error('Error:', rawError.message);
    } else {
        console.log(`Found ${rawData.length} raw assignments`);
        console.log('Raw data:', rawData);
    }

    // 3. Try the service query (with join)
    console.log('\n--- Service-style query (with join) ---');
    const { data: joinData, error: joinError } = await supabase
        .from('class_subjects')
        .select(`
            id,
            is_compulsory,
            created_at,
            subjects (*)
        `)
        .eq('class_id', classId);

    if (joinError) {
        console.error('Error:', joinError.message);
        console.error('Code:', joinError.code);
        console.error('Details:', joinError.details);
    } else {
        console.log(`Found ${joinData.length} assignments with subjects`);
        console.log('Joined data:', JSON.stringify(joinData, null, 2));
    }
}

testGetClassSubjects();
