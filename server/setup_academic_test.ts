
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
    console.log('--- Setting up Academic Data ---');

    // 1. Create/Get Session
    const { data: session, error: sErr } = await supabaseAdmin.from('sessions').upsert({
        name: '2025/2026',
        start_date: '2025-09-01',
        end_date: '2026-07-31',
        is_active: true
    }, { onConflict: 'name' }).select().single();

    if (sErr) console.error('Session Error:', sErr.message);
    else console.log('Session Ready:', session.name, session.id);

    // 2. Create/Get Term
    const { data: term, error: tErr } = await supabaseAdmin.from('terms').upsert({
        name: 'First Term'
    }, { onConflict: 'name' }).select().single();

    if (tErr) console.error('Term Error:', tErr.message);
    else console.log('Term Ready:', term.name, term.id);

    // 3. Add Student to JSS 1 (9a54a86f-ba5d-43a9-9ea1-286662255788)
    const classId = '9a54a86f-ba5d-43a9-9ea1-286662255788';
    const { data: student, error: stErr } = await supabaseAdmin.from('students').upsert({
        first_name: 'John',
        last_name: 'Doe',
        admission_number: 'ADM-001',
        class_id: classId,
        status: 'active',
        gender: 'male',
        dob: '2010-01-01'
    }, { onConflict: 'admission_number' }).select().single();

    if (stErr) console.error('Student Error:', stErr.message);
    else console.log('Student Ready:', student.first_name, student.last_name);

    console.log('\nSetup Complete! You can now test the teacher flow.');
}

setup();
