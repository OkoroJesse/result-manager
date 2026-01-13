
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

async function setup() {
    console.log('--- Restoring Test Data ---');

    const classId = '9a54a86f-ba5d-43a9-9ea1-286662255788'; // JSS 1
    const subjectId = '193bb9b1-7da7-4aae-ac18-82adfc78dede'; // Mathematics

    // 1. Restore Student
    console.log('Restoring student John Doe...');
    await supabaseAdmin.from('students').upsert({
        first_name: 'John',
        last_name: 'Doe',
        admission_number: 'ADM-001',
        class_id: classId,
        status: 'active',
        gender: 'male',
        dob: '2010-01-01'
    }, { onConflict: 'admission_number' });

    // 2. Restore Teacher Assignment
    console.log('Finding teacher record for teacher@resultly.com...');
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', 'teacher@resultly.com').single();
    if (!user) return console.error('Teacher user not found');

    const { data: teacher } = await supabaseAdmin.from('teachers').select('id').eq('auth_user_id', user.id).single();
    if (!teacher) return console.error('Teacher profile not found');

    console.log('Assigning teacher to Mathematics...');
    await supabaseAdmin.from('teacher_assignments').upsert({
        teacher_id: teacher.id,
        class_id: classId,
        subject_id: subjectId
    }, { onConflict: 'teacher_id,class_id,subject_id' });

    // 3. Ensure grading_scales has data
    console.log('Ensuring grading_scales has data...');
    const { data: scales } = await supabaseAdmin.from('grading_scales').select('count');
    if (!scales || (scales as any).count === 0) {
        await supabaseAdmin.from('grading_scales').insert([
            { min_score: 75, max_score: 100, grade: 'A1', remark: 'EXCELLENT' },
            { min_score: 70, max_score: 74, grade: 'B2', remark: 'VERY GOOD' },
            { min_score: 65, max_score: 69, grade: 'B3', remark: 'GOOD' },
            { min_score: 60, max_score: 64, grade: 'C4', remark: 'CREDIT' },
            { min_score: 55, max_score: 59, grade: 'C5', remark: 'CREDIT' },
            { min_score: 50, max_score: 54, grade: 'C6', remark: 'CREDIT' },
            { min_score: 45, max_score: 49, grade: 'D7', remark: 'PASS' },
            { min_score: 40, max_score: 44, grade: 'E8', remark: 'PASS' },
            { min_score: 0, max_score: 39, grade: 'F9', remark: 'FAIL' },
        ]);
        console.log('Grading scales seeded.');
    }

    console.log('--- TEST DATA RESTORED ---');
}

setup();
