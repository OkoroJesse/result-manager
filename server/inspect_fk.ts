
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

async function inspectFK() {
    console.log('--- Inspecting Foreign Keys ---');
    // We can't run raw SQL easily without an RPC. 
    // Let's see if we can discover the session table by trying different names.
    const tables = ['sessions', 'academic_sessions', 'school_sessions', 'academic_structure'];
    for (const t of tables) {
        const { data, error } = await supabaseAdmin.from(t).select('id').limit(1);
        if (!error) {
            console.log(`Table found: ${t}`);
            console.log('Data:', data);
        } else {
            // console.log(`Table not found: ${t}`);
        }
    }
}

inspectFK();
