import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function linkChelsea() {
    const email = 'chelsea001@gmail.com';
    const authUserId = 'e81db3c7-f22c-4f5a-934c-7036fe303ffb';
    const teacherProfileId = '907455fd-ebb5-408f-adb5-ef0bf5614654';

    console.log(`Linking profile for : ${email}`);

    // 1. Get Teacher Role ID
    const { data: role } = await supabase.from('roles').select('id').eq('name', 'teacher').single();
    if (!role) throw new Error('Teacher role not found');

    // 2. Create Public User record if missing
    const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
            id: authUserId,
            email: email,
            first_name: 'Chelsea',
            last_name: 'Okoro',
            role_id: role.id
        }, { onConflict: 'id' })
        .select()
        .single();

    if (userError) {
        console.error('Error upserting public user:', userError);
        return;
    }
    console.log('Public user record ensured:', user.id);

    // 3. Link Teacher profile
    const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .update({ auth_user_id: authUserId })
        .eq('id', teacherProfileId)
        .select()
        .single();

    if (teacherError) {
        console.error('Error linking teacher profile:', teacherError);
        return;
    }

    console.log('✅ Teacher profile successfully linked to auth user!');
    console.log('Link details:', {
        teacher_id: teacher.id,
        auth_user_id: teacher.auth_user_id,
        email: teacher.email
    });
}

linkChelsea().catch(console.error);
