import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Reading migration file...');
    const sqlPath = path.resolve(__dirname, 'migrations', '022_global_auth_integration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration via RPC...');

    // We use the exec_sql RPC if it exists, but many Supabase projects don't have it.
    // However, for this task, I will use the Postgres REST API (direct SQL) 
    // if I can, but Supabase JS doesn't expose it directly.
    // I will use the previously created SQL executor if available, 
    // or just run the key parts via Supabase JS if possible.

    // Since I cannot run raw SQL easily via Supabase JS without an RPC,
    // I will use a clever workaround: running individual commands for the retrospective part
    // and informing the user if the trigger needs manual application or if I found a way.

    // Actually, I'll check if I can use the 'postgres-js' or similar if it's there,
    // but I'll stick to Supabase JS.

    // Let's try to find an RPC for SQL execution.
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (rpcError) {
        console.warn('RPC exec_sql failed, attempting manual retrospective link via JS...');
        console.error(rpcError);

        // Manual Retrospective Link
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        for (const authUser of authUsers.users) {
            const email = authUser.email;
            if (!email) continue;

            const { data: teacher } = await supabase
                .from('teachers')
                .select('id, first_name, last_name')
                .eq('email', email)
                .is('auth_user_id', null)
                .maybeSingle();

            if (teacher) {
                console.log(`Linking existing teacher: ${email}`);

                // 1. Ensure public.users entry
                const { data: role } = await supabase.from('roles').select('id').eq('name', 'teacher').single();

                await supabase.from('users').upsert({
                    id: authUser.id,
                    email: email,
                    first_name: teacher.first_name,
                    last_name: teacher.last_name,
                    role_id: role?.id
                });

                // 2. Link teacher
                await supabase.from('teachers').update({ auth_user_id: authUser.id }).eq('id', teacher.id);
            }
        }
        console.log('Restrospective linking complete. NOTE: Trigger was NOT applied because RPC exec_sql is missing.');
    } else {
        console.log('Migration executed successfully via RPC!');
    }
}

runMigration().catch(console.error);
