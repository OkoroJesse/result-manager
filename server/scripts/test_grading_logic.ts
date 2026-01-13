
import { supabase } from '../src/config/supabase';

async function testGradingLogic() {
    console.log('--- TESTING GRADING LOGIC ---');

    // 1. Get a valid Student, Class, Subject, Session, Term to use
    // We'll reuse existing ones to strict constraints don't fail us
    const { data: student } = await supabase.from('students').select('id, current_class_id').limit(1).single();
    const { data: subject } = await supabase.from('subjects').select('id').limit(1).single();
    const { data: session } = await supabase.from('academic_sessions').select('id').limit(1).single();
    const { data: term } = await supabase.from('terms').select('id').limit(1).single();

    if (!student || !subject || !session || !term) {
        console.error('Missing prereq data (student/subject/session/term)');
        return;
    }

    console.log('Test Context:', {
        student: student.id,
        class: student.current_class_id,
        subject: subject.id
    });

    // 2. Insert Result (Draft) with Scores -> Expect Grade A
    // Scores: CA=30, Test=10, Exam=30 => Total=70 => A
    const testDataA = {
        student_id: student.id,
        class_id: student.current_class_id, // Must match student's class for realism usually, but constraint might not enforce it strictly yet
        subject_id: subject.id,
        session_id: session.id,
        term_id: term.id,
        score_ca: 30,
        score_test: 10,
        score_exam: 30,
        status: 'draft'
    };

    console.log('Inserting "A" Grade Result...');
    const { data: resA, error: errA } = await supabase
        .from('results')
        .upsert(testDataA, { onConflict: 'student_id,subject_id,session_id,term_id' })
        .select()
        .single();

    if (errA) {
        console.error('Insert Failed:', errA);
        return;
    }

    console.log(`[A CHECK] Total: ${resA.total_score} (Exp: 70), Grade: ${resA.grade} (Exp: A), Remark: ${resA.remark}`);

    // 3. Update Result to "Fail"
    // Scores: CA=10, Test=5, Exam=10 => Total=25 => F
    console.log('Updating to "F" Grade Result...');
    const { data: resF, error: errF } = await supabase
        .from('results')
        .update({ score_ca: 10, score_test: 5, score_exam: 10 })
        .eq('id', resA.id)
        .select()
        .single();

    if (errF) {
        console.error('Update Failed:', errF);
    } else {
        console.log(`[F CHECK] Total: ${resF.total_score} (Exp: 25), Grade: ${resF.grade} (Exp: F), Remark: ${resF.remark}`);
    }

    // 4. Cleanup
    console.log('Cleaning up test result...');
    await supabase.from('results').delete().eq('id', resA.id);
    console.log('--- TEST COMPLETE ---');
}

testGradingLogic();
