
import { supabase } from '../src/config/supabase';

async function checkUserRole() {
    try {
        const email = 'chelsea001@gmail.com';
        console.log(`Checking roles for: ${email}`);

        // Check users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, role, is_active')
            .eq('email', email);

        if (userData && userData.length > 0) {
            console.log('USERS TABLE RECORD:', JSON.stringify(userData, null, 2));
        } else {
            console.log('User NOT found in users table.');
        }

        // Check teachers table
        const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('id, email, user_id')
            .eq('email', email);

        if (teacherData && teacherData.length > 0) {
            console.log('TEACHERS TABLE RECORD:', JSON.stringify(teacherData, null, 2));
        } else {
            console.log('User NOT found in teachers table.');
        }

    } catch (e) {
        console.error('Script error:', e);
    }
}

checkUserRole();
