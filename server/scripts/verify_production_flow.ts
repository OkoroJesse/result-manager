import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyProductionFlow() {
    console.log('🔍 PRODUCTION-CRITICAL VERIFICATION\n');
    console.log('='.repeat(60));

    try {
        // 1. Verify Active Session/Term
        console.log('\n1️⃣ Verifying Active Academic Context...');
        const { data: activeSession } = await supabase
            .from('sessions')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();

        if (!activeSession) {
            console.log('   ❌ CRITICAL: No active session found!');
            return;
        }
        console.log(`   ✅ Active Session: ${activeSession.name} (${activeSession.id})`);

        const { data: activeTerm } = await supabase
            .from('terms')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();

        if (!activeTerm) {
            console.log('   ❌ CRITICAL: No active term found!');
            return;
        }
        console.log(`   ✅ Active Term: ${activeTerm.name} (${activeTerm.id})`);

        // 2. Verify Teacher Assignments Schema
        console.log('\n2️⃣ Verifying Teacher Assignments Schema...');
        const { data: sampleAssignment } = await supabase
            .from('teacher_assignments')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (sampleAssignment) {
            const hasSessionId = 'academic_session_id' in sampleAssignment;
            const hasIsActive = 'is_active' in sampleAssignment;

            if (hasSessionId && hasIsActive) {
                console.log('   ✅ Schema updated: academic_session_id ✓, is_active ✓');
            } else {
                console.log(`   ⚠️  Schema incomplete: academic_session_id ${hasSessionId ? '✓' : '✗'}, is_active ${hasIsActive ? '✓' : '✗'}`);
            }
        }

        // 3. Test Teacher Assignment Filtering
        console.log('\n3️⃣ Testing Teacher Assignment Filtering...');
        const { data: teachers } = await supabase
            .from('teachers')
            .select('id, first_name, last_name, auth_user_id')
            .limit(1);

        if (teachers && teachers.length > 0) {
            const testTeacher = teachers[0];
            console.log(`   Testing with: ${testTeacher.first_name} ${testTeacher.last_name}`);

            const { data: assignments } = await supabase
                .from('teacher_assignments')
                .select(`
                    *,
                    classes(name),
                    subjects(name)
                `)
                .eq('teacher_id', testTeacher.id)
                .eq('academic_session_id', activeSession.id)
                .eq('is_active', true);

            console.log(`   ✅ Active assignments for current session: ${assignments?.length || 0}`);
            if (assignments && assignments.length > 0) {
                assignments.forEach((a: any) => {
                    console.log(`      - ${a.classes?.name} / ${a.subjects?.name}`);
                });
            }
        }

        // 4. Verify RLS Policies
        console.log('\n4️⃣ Checking RLS Policies...');
        const { data: policies } = await supabase
            .from('pg_policies')
            .select('tablename, policyname')
            .in('tablename', ['teacher_assignments', 'results', 'students']);

        if (policies && policies.length > 0) {
            console.log('   ✅ RLS Policies found:');
            policies.forEach((p: any) => {
                console.log(`      - ${p.tablename}: ${p.policyname}`);
            });
        } else {
            console.log('   ⚠️  Unable to query policies (may require manual verification)');
        }

        // 5. Test Result Submission Flow
        console.log('\n5️⃣ Testing Result Submission Validation...');
        const { data: testClass } = await supabase
            .from('classes')
            .select('id, name')
            .limit(1)
            .single();

        const { data: testSubject } = await supabase
            .from('subjects')
            .select('id, name')
            .limit(1)
            .single();

        if (testClass && testSubject && teachers && teachers.length > 0) {
            console.log(`   Testing submission validation for: ${testClass.name} / ${testSubject.name}`);

            // Check if teacher has assignment
            const { data: hasAssignment } = await supabase
                .from('teacher_assignments')
                .select('id')
                .match({
                    teacher_id: teachers[0].id,
                    class_id: testClass.id,
                    subject_id: testSubject.id,
                    academic_session_id: activeSession.id,
                    is_active: true
                })
                .maybeSingle();

            if (hasAssignment) {
                console.log('   ✅ Assignment validation would PASS');
            } else {
                console.log('   ℹ️  Assignment validation would FAIL (expected for test)');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ VERIFICATION COMPLETE\n');
        console.log('📋 CHECKLIST:');
        console.log('   [ ] Active session and term exist');
        console.log('   [ ] teacher_assignments has academic_session_id column');
        console.log('   [ ] Teachers see only current session assignments');
        console.log('   [ ] RLS policies are active');
        console.log('   [ ] Result submission validates teacher ownership\n');

    } catch (error: any) {
        console.error('\n❌ Verification failed:', error.message);
    }
}

verifyProductionFlow().catch(console.error);
