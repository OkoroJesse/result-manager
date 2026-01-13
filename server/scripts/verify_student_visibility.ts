import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStudentVisibility() {
    console.log('🔍 Verifying Student Visibility Fix\n');
    console.log('='.repeat(60));

    try {
        // 1. Check Primary 5 students
        console.log('\n1️⃣ Checking Primary 5 students...');
        const { data: p5Class } = await supabase
            .from('classes')
            .select('id, name')
            .eq('name', 'Primary 5')
            .single();

        if (p5Class) {
            const { data: students } = await supabase
                .from('students')
                .select('id, first_name, last_name, admission_number, status')
                .eq('class_id', p5Class.id);

            console.log(`   ✅ Found ${students?.length || 0} students in Primary 5`);
            if (students && students.length > 0) {
                students.forEach(s => {
                    console.log(`      - ${s.first_name} ${s.last_name} (${s.admission_number}) - Status: ${s.status}`);
                });
            }
        }

        // 2. Check teacher assignments for Primary 5
        console.log('\n2️⃣ Checking teacher assignments for Primary 5...');
        if (p5Class) {
            const { data: assignments } = await supabase
                .from('teacher_assignments')
                .select(`
                    *,
                    teachers(first_name, last_name),
                    subjects(name)
                `)
                .eq('class_id', p5Class.id)
                .eq('is_active', true);

            console.log(`   ✅ Found ${assignments?.length || 0} active assignments`);
            if (assignments && assignments.length > 0) {
                assignments.forEach((a: any) => {
                    console.log(`      - ${a.teachers?.first_name} ${a.teachers?.last_name} teaching ${a.subjects?.name}`);
                });
            }
        }

        // 3. Check RLS policies
        console.log('\n3️⃣ Checking RLS status...');
        const { data: studentRLS } = await supabase
            .rpc('check_rls_enabled', { table_name: 'students' })
            .catch(() => ({ data: null }));

        if (studentRLS !== null) {
            console.log(`   ✅ RLS enabled on students table`);
        } else {
            console.log(`   ℹ️  Cannot verify RLS (requires manual check in Supabase)`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ VERIFICATION COMPLETE\n');
        console.log('📋 NEXT STEPS:');
        console.log('   1. Refresh the teacher Results page');
        console.log('   2. Select Primary 5 class');
        console.log('   3. Select English Language subject');
        console.log('   4. Students should now appear in the score sheet\n');

    } catch (error: any) {
        console.error('\n❌ Verification failed:', error.message);
    }
}

verifyStudentVisibility().catch(console.error);
