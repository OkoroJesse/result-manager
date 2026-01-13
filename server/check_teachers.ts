import { supabase } from './src/config/supabase';

async function checkTeachers() {
    console.log('Checking teachers table...');

    // We want to see if the current user (admin) has a teacher profile
    // Since we don't have the auth.uid() here easily, let's just list all teachers

    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('id, first_name, last_name, email, auth_user_id');

        if (error) {
            console.error('Error fetching teachers:', error.message);
        } else {
            console.log('Total teachers in system:', data.length);
            data.forEach(t => {
                console.log(`- ${t.first_name} ${t.last_name} (${t.email}), auth_user_id: ${t.auth_user_id}`);
            });
        }

        // Let's also check the users table (if accessible via service role)
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email, role_id, roles(name)');

        if (userError) {
            console.error('Error fetching users:', userError.message);
        } else {
            console.log('\nTotal users in system:', users.length);
            users.forEach(u => {
                const roleName = (u as any).roles?.name;
                console.log(`- User: ${u.email}, ID: ${u.id}, Role: ${roleName}`);
            });
        }

    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkTeachers();
