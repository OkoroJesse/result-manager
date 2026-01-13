
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

async function diagnose() {
    console.log('--- Teacher Data Diagnostic ---');

    console.log('1. Checking user record for teacher@resultly.com...');
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('email', 'teacher@resultly.com').single();
    if (!user) return console.error('User not found');
    console.log('User ID:', user.id);

    console.log('2. Checking teacher profile...');
    const { data: teacher } = await supabaseAdmin.from('teachers').select('*').eq('auth_user_id', user.id).single();
    if (!teacher) return console.error('Teacher profile not found');
    console.log('Teacher ID:', teacher.id);

    console.log('3. Checking teacher assignments...');
    const { data: assignments } = await supabaseAdmin.from('teacher_assignments').select(`
        *,
        classes ( id, name ),
        subjects ( id, name, code )
    `).eq('teacher_id', teacher.id);
    console.log('Assignments:', JSON.stringify(assignments, null, 2));

    const selectedClassId = '9a54a86f-ba5d-43a9-9ea1-286662255788'; // JSS 1
    console.log(`4. Checking subjects for class JSS 1 (${selectedClassId})...`);
    const { data: classSubjects } = await supabaseAdmin.from('class_subjects').select(`
        *,
        subjects ( id, name )
    `).eq('class_id', selectedClassId);
    console.log('Class Subjects:', JSON.stringify(classSubjects, null, 2));

    console.log('--- Diagnostic Complete ---');
}

diagnose();
