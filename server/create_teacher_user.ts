
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createTeacherUser() {
    console.log('--- Creating Test Teacher Account ---');

    const email = 'teacher@resultly.com';
    const password = 'password123';
    const firstName = 'Test';
    const lastName = 'Teacher';

    // 1. Create Auth User
    console.log(`Creating Auth User: ${email}`);
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
    });

    let userId = authUser?.user?.id;

    if (authError) {
        if (authError.message.includes('already registered') || (authError as any).code === 'email_exists') {
            console.log('User already exists, fetching ID...');
            // Fetch existing user ID
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existing = existingUsers.users.find(u => u.email === email);
            if (existing) {
                userId = existing.id;
                console.log('Found existing user ID:', userId);
                // Update password just in case
                await supabaseAdmin.auth.admin.updateUserById(userId, { password });
                console.log('Updated password to:', password);
            } else {
                console.error('Could not find existing user.');
                return;
            }
        } else {
            console.error('Error creating auth user:', authError);
            return;
        }
    } else {
        console.log('Auth User Created:', userId);
    }

    if (!userId) return;

    // 2. Get Teacher Role ID
    const { data: role, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

    if (roleError) {
        console.error('Error fetching teacher role:', roleError);
        return;
    }
    console.log('Teacher Role ID:', role.id);

    // 3. Update public.users with Role
    // Use upsert to ensure it exists
    const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: userId,
            email,
            role_id: role.id,
            first_name: firstName,
            last_name: lastName
        });

    if (upsertError) {
        console.error('Error upserting public user:', upsertError);
        return;
    }
    console.log('Upserted public.users record.');

    // 4. Create or Link Teachers Profile
    // Check if profile exists for this auth_user_id
    const { data: existingProfile } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();

    if (existingProfile) {
        console.log('Teacher profile already linked:', existingProfile.id);
    } else {
        // Create new teacher profile linked to this user
        const { data: newTeacher, error: teacherError } = await supabaseAdmin
            .from('teachers')
            .insert({
                first_name: firstName,
                last_name: lastName,
                email: email,
                staff_id: 'TCH-TEST-001',
                status: 'active',
                auth_user_id: userId
            })
            .select()
            .single();

        if (teacherError) {
            console.error('Error creating teacher profile:', teacherError);
            return;
        }
        console.log('Created new linked Teacher Profile:', newTeacher.id);
    }

    console.log('\nSUCCESS! You can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

createTeacherUser();
