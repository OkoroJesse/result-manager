import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
    const migrationFiles = [
        '023_fix_rls_policies.sql',
        '024_production_data_cleanup.sql'
    ];

    for (const file of migrationFiles) {
        console.log(`Reading migration file: ${file}...`);
        const sqlPath = path.resolve(__dirname, 'migrations', file);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Executing ${file}...`);
        // We attempt to run via exec_sql if available
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (rpcError) {
            console.error(`RPC exec_sql failed for ${file}:`, rpcError);

            // If the trigger or cleanup is critical, we might try manual JS logic here
            // but for RLS and SQL updates, RPC is the only way to apply files.
            // For now, we inform and continue.
        } else {
            console.log(`${file} applied successfully!`);
        }
    }
}

runMigrations().catch(console.error);
