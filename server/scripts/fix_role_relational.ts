
import { supabase } from '../src/config/supabase';

async function fixUserRoleRelational() {
    console.log('Fetching roles...');

    // 1. Get Roles
    const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*');

    if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
    }

    console.log('Available Roles:', roles);

    const teacherRole = roles.find((r: any) => r.name === 'teacher');
    if (!teacherRole) {
        console.error('Teacher role not found!');
        return;
    }

    console.log(`Teacher Role ID: ${teacherRole.id}`);

    // 2. Get User
    const email = 'chelsea001@gmail.com';
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError) {
        console.error('User not found:', userError);
        return;
    }

    console.log('Target User:', user.email, 'Current FK:', user.role_id || user.role);

    // 3. Update User
    // Try 'role_id' first as it's most common FK naming
    const { error: updateError } = await supabase
        .from('users')
        .update({ role_id: teacherRole.id })
        .eq('id', user.id);

    if (updateError) {
        console.error('Update failed:', updateError);
        // Fallback: maybe column is just 'role' but expects uuid?
    } else {
        console.log('Successfully updated users table role_id.');
    }

    // 4. Ensure Teacher Profile
    const { data: teacherProfile } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id);

    if (!teacherProfile || teacherProfile.length === 0) {
        console.log('Creating missing teacher profile...');
        await supabase.from('teachers').insert([{
            user_id: user.id,
            first_name: user.first_name || 'Chelsea',
            last_name: user.last_name || 'User',
            email: email,
            staff_id: 'T-' + Math.floor(Math.random() * 10000)
        }]);
        console.log('Teacher profile created.');
    }
}

fixUserRoleRelational();
