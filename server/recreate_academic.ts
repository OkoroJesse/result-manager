
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

async function recreate() {
    console.log('--- Recreating Academic Structure ---');

    // 1. Delete dependent data
    console.log('Cleaning up results...');
    await supabaseAdmin.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Cleaning up terms...');
    await supabaseAdmin.from('terms').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Cleaning up sessions...');
    await supabaseAdmin.from('academic_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Create fresh session
    console.log('Creating session 2025/2026...');
    const { data: session, error: sErr } = await supabaseAdmin.from('academic_sessions').insert({
        name: '2025/2026',
        start_date: '2025-09-01',
        end_date: '2026-07-31',
        is_active: true
    }).select().single();

    if (sErr) return console.error('Session Creation Error:', sErr.message);
    const sessionId = session.id;

    // 3. Create fresh term
    console.log('Creating First Term...');
    const { data: term, error: tErr } = await supabaseAdmin.from('terms').insert({
        name: 'First Term',
        session_id: sessionId,
        is_active: true,
        order: 1,
        start_date: '2025-09-01',
        end_date: '2025-12-15'
    }).select().single();

    if (tErr) return console.error('Term Creation Error:', tErr.message);

    console.log('--- RECREATION SUCCESSFUL ---');
    console.log('Active Session:', session.name, sessionId);
    console.log('Active Term:', term.name, term.id);
}

recreate();
