
import { supabase } from '../src/config/supabase';
import fs from 'fs';
import path from 'path';

async function debugVerification() {
    const logPath = path.join(__dirname, 'debug_log.txt');
    const log = (msg: string) => fs.appendFileSync(logPath, msg + '\n');

    fs.writeFileSync(logPath, 'START DEBUG\n');

    try {
        // 1. Get Session
        const { data: session, error: sessErr } = await supabase
            .from('academic_sessions')
            .select('id, name')
            .limit(1)
            .single();

        if (sessErr) {
            log(`Session Fetch Error: ${JSON.stringify(sessErr)}`);
            return;
        }
        log(`Session Found: ${session.id} (${session.name})`);

        // 2. Get Term
        const { data: term } = await supabase.from('terms').select('id').limit(1).single();
        log(`Term Found: ${term?.id}`);

        // 3. Get Student
        const { data: student } = await supabase.from('students').select('id, current_class_id').limit(1).single();
        log(`Student Found: ${student?.id} (Class: ${student?.current_class_id})`);

        // 4. Get Subject
        const { data: subject } = await supabase.from('subjects').select('id').limit(1).single();
        log(`Subject Found: ${subject?.id}`);

        if (!session || !term || !student || !subject) {
            log('MISSING DATA');
            return;
        }

        // 5. Insert
        const payload = {
            student_id: student.id,
            class_id: student.current_class_id,
            subject_id: subject.id,
            session_id: session.id,
            term_id: term.id,
            score_ca: 30,
            score_test: 10,
            score_exam: 30,
            status: 'draft'
        };

        log(`Attempting Insert Payload: ${JSON.stringify(payload)}`);

        const { data, error } = await supabase.from('results').insert(payload).select().single();

        if (error) {
            log(`INSERT ERROR: ${JSON.stringify(error, null, 2)}`);
        } else {
            log(`SUCCESS: Created Result ${data.id}`);
            log(`Total: ${data.total_score}, Grade: ${data.grade}, Remark: ${data.remark}`);

            // Clean
            await supabase.from('results').delete().eq('id', data.id);
        }

    } catch (e: any) {
        log(`EXCEPTION: ${e.message}`);
    }
}

debugVerification();
