
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

async function listAllTables() {
    console.log('--- Listing All Tables ---');
    // Using a trick: try to select from information_schema.tables
    const { data, error } = await supabaseAdmin.from('information_schema.tables').select('table_name, table_schema');
    if (error) {
        console.error('Error listing tables via information_schema:', error.message);
        return;
    }
    const publicTables = data.filter(t => t.table_schema === 'public');
    console.log('Public Tables:', publicTables.map(t => t.table_name).join(', '));
}

listAllTables();
