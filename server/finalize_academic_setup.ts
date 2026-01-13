
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

async function fix() {
    console.log('--- Finalizing Academic Setup ---');

    // 1. Get correct session
    const { data: sessions } = await supabaseAdmin.from('sessions').select('id, name');
    const session = sessions?.find(s => s.name === '2025/2026');

    if (!session) {
        console.error('Session 2025/2026 not found.');
        return;
    }

    // 2. Deactivate everything
    console.log('Deactivating all sessions and terms...');
    await supabaseAdmin.from('sessions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('terms').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Link and activate 2025/2026 First Term
    console.log('Activating 2025/2026 First Term...');
    await supabaseAdmin.from('sessions').update({ is_active: true }).eq('id', session.id);
    const { error: tErr } = await supabaseAdmin.from('terms').update({
        session_id: session.id,
        is_active: true
    }).eq('name', 'First Term');

    if (tErr) console.error('Term Update Error:', tErr.message);
    else console.log('First Term activated and linked to correct session.');

    // 4. Grading Scales
    console.log('Checking grading_scales...');
    const { data: scales, error: scaleErr } = await supabaseAdmin.from('grading_scales').select('*');

    if (scaleErr) {
        console.log('Grading scales table might be missing or errored:', scaleErr.message);
    } else if (scales.length === 0) {
        console.log('Seeding grading scales...');
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
    } else {
        console.log('Grading scales already present.');
    }

    console.log('\nSetup Fixed! Teacher@resultly.com should now see First Term data.');
}

fix();
