
import { supabase } from '../src/config/supabase';

async function fixUserRole() {
    const email = 'chelsea001@gmail.com';
    console.log(`Fixing role for: ${email}`);

    // JOIN/Fetch user ID
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .single();

    if (userError || !userData) {
        console.error('User not found in users table:', userError);
        return;
    }

    console.log(`Current Role: ${userData.role}`);

    // Update to teacher
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'teacher' })
        .eq('id', userData.id);

    if (updateError) {
        console.error('Failed to update role:', updateError);
        return;
    }
    console.log('Successfully updated users table role to "teacher".');

    // Check teachers table
    const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userData.id);

    if (!teacherData || teacherData.length === 0) {
        console.log('Creating missing teacher profile...');
        const { error: insertError } = await supabase
            .from('teachers')
            .insert([{
                user_id: userData.id,
                first_name: 'Chelsea',
                last_name: 'User',
                email: email,
                staff_id: 'T-' + Math.floor(Math.random() * 10000)
            }]);

        if (insertError) console.error('Error creating teacher profile:', insertError);
        else console.log('Teacher profile created.');
    } else {
        console.log('Teacher profile already exists.');
    }
}

fixUserRole();
