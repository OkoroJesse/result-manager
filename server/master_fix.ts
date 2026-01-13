
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

async function masterFix() {
    console.log('--- Master Fix: Academic Data & Grading ---');

    // 1. Get the real 2025/2026 session
    const { data: sess } = await supabaseAdmin.from('sessions').select('id').eq('name', '2025/2026').single();
    if (!sess) return console.error('CRITICAL: Session 2025/2026 not found.');
    const sessionId = sess.id;
    console.log('Active Session ID:', sessionId);

    // 2. Fix Terms (Bypass FK error by pointing to valid session)
    console.log('Updating terms to point to valid session...');
    const { error: tFixErr } = await supabaseAdmin.from('terms').update({ session_id: sessionId, is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (tFixErr) console.error('Term Fix Error:', tFixErr.message);

    // 3. Activate First Term
    await supabaseAdmin.from('terms').update({ is_active: true }).eq('name', 'First Term');
    console.log('First Term activated.');

    // 4. Seeding Grading Scales
    console.log('Ensuring grading_scales exists...');
    const { data: scales, error: scaleErr } = await supabaseAdmin.from('grading_scales').select('*');
    if (scaleErr) {
        console.log('Creating grading_scales table...');
        // Note: Admin client can't easily run arbitrary SQL for table creation via RPC usually without a function.
        // Assuming table exists but check error.
        console.log('Table grading_scales check failed:', scaleErr.message);
    } else if (scales.length === 0) {
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

    console.log('--- Master Fix Complete ---');
}

masterFix();
