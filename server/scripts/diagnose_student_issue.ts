import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 COMPREHENSIVE DIAGNOSTIC\n');
    console.log('='.repeat(70));

    try {
        // 1. Check if Primary 5 class exists
        console.log('\n1️⃣ Checking Primary 5 class...');
        const { data: p5Class, error: classError } = await supabase
            .from('classes')
            .select('*')
            .eq('name', 'Primary 5')
            .maybeSingle();

        if (classError) {
            console.log('   ❌ Error fetching class:', classError.message);
            return;
        }

        if (!p5Class) {
            console.log('   ❌ Primary 5 class NOT FOUND!');
            console.log('   Creating Primary 5 class...');
            const { data: newClass } = await supabase
                .from('classes')
                .insert({ name: 'Primary 5' })
                .select()
                .single();
            console.log('   ✅ Created Primary 5:', newClass?.id);
            return;
        }

        console.log(`   ✅ Primary 5 exists: ${p5Class.id}`);

        // 2. Check students in Primary 5
        console.log('\n2️⃣ Checking students in Primary 5...');
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', p5Class.id);

        if (studentsError) {
            console.log('   ❌ Error fetching students:', studentsError.message);
        } else {
            console.log(`   ✅ Found ${students?.length || 0} students`);
            if (students && students.length > 0) {
                students.forEach(s => {
                    console.log(`      - ${s.first_name} ${s.last_name} (${s.admission_number}) - Status: ${s.status}`);
                });
            } else {
                console.log('   ⚠️  NO STUDENTS in Primary 5!');
                console.log('   This is why the list is empty.');
            }
        }

        // 3. Check if English Language subject exists
        console.log('\n3️⃣ Checking English Language subject...');
        const { data: subject } = await supabase
            .from('subjects')
            .select('*')
            .ilike('name', '%English%')
            .maybeSingle();

        if (subject) {
            console.log(`   ✅ Found subject: ${subject.name} (${subject.id})`);
        } else {
            console.log('   ❌ English Language subject NOT FOUND!');
        }

        // 4. Check teacher assignments for Primary 5
        console.log('\n4️⃣ Checking teacher assignments for Primary 5...');
        const { data: assignments } = await supabase
            .from('teacher_assignments')
            .select(`
                *,
                teachers(first_name, last_name),
                subjects(name)
            `)
            .eq('class_id', p5Class.id);

        console.log(`   Found ${assignments?.length || 0} assignments`);
        if (assignments && assignments.length > 0) {
            assignments.forEach((a: any) => {
                console.log(`      - ${a.teachers?.first_name} ${a.teachers?.last_name} teaching ${a.subjects?.name}`);
            });
        }

        // 5. Test API endpoint
        console.log('\n5️⃣ Testing /api/people/students endpoint...');
        try {
            const response = await axios.get(`http://localhost:5000/api/people/students`, {
                params: {
                    class_id: p5Class.id,
                    status: 'active'
                }
            });
            console.log(`   ✅ API returned ${response.data?.length || 0} students`);
        } catch (error: any) {
            console.log(`   ❌ API Error: ${error.response?.status} - ${error.response?.statusText}`);
            console.log(`   Message: ${error.response?.data?.error || error.message}`);
        }

        // 6. Check RLS status
        console.log('\n6️⃣ Checking RLS status...');
        const tables = ['students', 'teacher_assignments', 'results'];
        for (const table of tables) {
            const { data } = await supabase
                .rpc('check_table_rls', { table_name: table })
                .catch(() => ({ data: null }));

            if (data !== null) {
                console.log(`   ${table}: RLS ${data ? 'ENABLED' : 'DISABLED'}`);
            } else {
                console.log(`   ${table}: Cannot verify (check manually)`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ DIAGNOSTIC COMPLETE\n');

    } catch (error: any) {
        console.error('\n❌ Diagnostic failed:', error.message);
    }
}

diagnose().catch(console.error);
