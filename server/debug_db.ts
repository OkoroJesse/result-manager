
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

async function debug() {
    console.log('--- Debugging DB Schema ---');

    // Check sessions
    const { data: sData } = await supabaseAdmin.from('sessions').select('*');
    console.log('Sessions Table (Rows):', sData?.length);
    if (sData && sData.length > 0) console.log('Session Keys:', Object.keys(sData[0]));

    // Check terms
    const { data: tData } = await supabaseAdmin.from('terms').select('*');
    console.log('Terms Table (Rows):', tData?.length);
    if (tData && tData.length > 0) console.log('Term Keys:', Object.keys(tData[0]));

    // Try a single update with a tiny payload to isolate the error
    if (sData && sData.length > 0 && tData && tData.length > 0) {
        console.log(`Attempting to link Term ${tData[0].id} to Session ${sData[0].id}...`);
        const { error } = await supabaseAdmin.from('terms').update({ session_id: sData[0].id }).eq('id', tData[0].id);
        if (error) {
            console.error('Update Error (Details):', JSON.stringify(error, null, 2));
        } else {
            console.log('Update success!');
        }
    }
}

debug();
