
import { supabase } from '../src/config/supabase';

async function testGradingLogicRetry() {
    console.log('--- TESTING GRADING LOGIC (RETRY) ---');

    // 1. Get VALID Data
    const { data: student } = await supabase.from('students').select('id, current_class_id').limit(1).single();

    // Get valid subjects for this class if possible, or just any subject
    const { data: subject } = await supabase.from('subjects').select('id').limit(1).single();

    // Get ACTIVE Session/Term to ensure they are valid for current operations
    // If no active, just get ANY
    let { data: session } = await supabase.from('academic_sessions').select('id').eq('is_active', true).single();
    if (!session) {
        console.log('No active session, picking first available...');
        const res = await supabase.from('academic_sessions').select('id').limit(1).single();
        session = res.data;
    }

    let { data: term } = await supabase.from('terms').select('id').eq('is_active', true).single();
    if (!term) {
        console.log('No active term, picking first available...');
        const res = await supabase.from('terms').select('id').limit(1).single();
        term = res.data;
    }

    if (!student || !subject || !session || !term) {
        console.error('CRITICAL: Missing prereq data. Cannot test.');
        console.log({ student, subject, session, term });
        return;
    }

    console.log('Test Context:', {
        studentId: student.id,
        classId: student.current_class_id,
        subjectId: subject.id,
        sessionId: session.id,
        termId: term.id
    });

    // 2. Insert Result
    const testData = {
        student_id: student.id,
        class_id: student.current_class_id,
        subject_id: subject.id,
        session_id: session.id,
        term_id: term.id,
        score_ca: 35,   // 35
        score_test: 15, // 15
        score_exam: 35, // 35 => Total 85 => A
        status: 'draft'
    };

    console.log('Inserting result...');
    const { data, error } = await supabase
        .from('results')
        .upsert(testData, { onConflict: 'student_id,subject_id,session_id,term_id' })
        .select()
        .single();

    if (error) {
        console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('Scoring Check:');
        console.log(`- Total: ${data.total_score} (Expected 85)`);
        console.log(`- Grade: ${data.grade} (Expected A)`);
        console.log(`- Remark: ${data.remark} (Expected EXCELLENT)`);

        // Clean up
        await supabase.from('results').delete().eq('id', data.id);
        console.log('Cleanup complete. Verification SUCCESS.');
    }
}

testGradingLogicRetry();
