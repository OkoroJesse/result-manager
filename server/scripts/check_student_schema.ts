import { supabase } from '../src/config/supabase';

async function checkSchema() {
    try {
        console.log('--- Checking Students Table ---');
        const { data: studentData, error: studentError } = await supabase.from('students').select('*').limit(1);
        if (studentError) {
            console.error('Students Table Error:', studentError);
        } else if (studentData && studentData.length > 0) {
            console.log('STUDENT_COLUMNS:', Object.keys(studentData[0]));
        } else {
            console.log('STUDENT_TABLE_EMPTY or NO_COLUMNS_FETCHED');
        }

        console.log('\n--- Checking Users/Profiles Table ---');
        const { data: userData, error: userError } = await supabase.from('users').select('*').limit(1);
        if (userError) {
            console.error('Users Table Error:', userError);
        } else if (userData && userData.length > 0) {
            console.log('USER_COLUMNS:', Object.keys(userData[0]));
        } else {
            console.log('USER_TABLE_EMPTY');
        }

    } catch (err) {
        console.error('GLOBAL_ERROR:', err);
    }
}

checkSchema();
