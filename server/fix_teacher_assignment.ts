
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

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function fix() {
    console.log('--- Fixing Teacher Assignment ---');

    console.log('Fetching teacher user...');
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', 'teacher@resultly.com').single();
    if (!user) return console.error('User not found');

    const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('auth_user_id', user.id).single();
    if (!teacher) return console.error('Teacher profile not found');

    const classId = '9a54a86f-ba5d-43a9-9ea1-286662255788'; // JSS 1
    const correctSubjectId = '3b02c7b2-173a-4136-94a3-ff9c5b6ef3e6'; // Mathematics (JSS Level)

    console.log(`Updating assignment for teacher ${teacher.id} in class ${classId} to subject ${correctSubjectId}...`);

    // Check if it exists first
    const { data: existing } = await supabaseAdmin.from('teacher_assignments')
        .select('*')
        .match({ teacher_id: teacher.id, class_id: classId });

    if (existing && existing.length > 0) {
        console.log('Existing assignment found. Updating...');
        const { error } = await supabaseAdmin.from('teacher_assignments')
            .update({ subject_id: correctSubjectId })
            .match({ teacher_id: teacher.id, class_id: classId });

        if (error) console.error('Update Error:', error.message);
        else console.log('Update success!');
    } else {
        console.log('No assignment found. Inserting...');
        const { error } = await supabaseAdmin.from('teacher_assignments')
            .insert({
                teacher_id: teacher.id,
                class_id: classId,
                subject_id: correctSubjectId
            });

        if (error) console.error('Insert Error:', error.message);
        else console.log('Insert success!');
    }

    console.log('--- Fix Complete ---');
}

fix();
