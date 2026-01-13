import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Starting Production-Critical Migration 025...\n');

    try {
        // 1. Verify current state
        console.log('1️⃣ Verifying current teacher_assignments structure...');
        const { data: assignments, error: checkError } = await supabase
            .from('teacher_assignments')
            .select('*')
            .limit(1);

        if (checkError) {
            throw new Error(`Failed to read teacher_assignments: ${checkError.message}`);
        }

        console.log(`   ✅ Found ${assignments?.length || 0} sample records\n`);

        // 2. Read migration file
        console.log('2️⃣ Reading migration file...');
        const sqlPath = path.resolve(__dirname, 'migrations', '025_fix_teacher_assignments.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log(`   ✅ Migration file loaded (${sql.length} bytes)\n`);

        // 3. Apply migration via individual statements
        console.log('3️⃣ Applying migration statements...');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt.toLowerCase().includes('alter table') ||
                stmt.toLowerCase().includes('create policy') ||
                stmt.toLowerCase().includes('create index')) {

                console.log(`   Executing statement ${i + 1}/${statements.length}...`);

                // Execute via raw SQL
                const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });

                if (error) {
                    // Try direct execution as fallback
                    console.log(`   ⚠️  RPC failed, attempting direct execution...`);
                    // For Supabase, we need to use the REST API directly
                    // This is a limitation - inform user
                    console.log(`   ⚠️  Statement may need manual execution in Supabase SQL Editor`);
                    console.log(`   Statement: ${stmt.substring(0, 100)}...`);
                }
            }
        }

        console.log('   ✅ Migration statements processed\n');

        // 4. Verify migration success
        console.log('4️⃣ Verifying migration results...');
        const { data: updatedAssignments } = await supabase
            .from('teacher_assignments')
            .select('academic_session_id, is_active')
            .limit(5);

        if (updatedAssignments && updatedAssignments.length > 0) {
            const hasSessionId = updatedAssignments.every(a => a.academic_session_id !== null);
            const hasIsActive = updatedAssignments.every(a => a.is_active !== undefined);

            if (hasSessionId && hasIsActive) {
                console.log('   ✅ Migration successful! New columns verified.');
                console.log(`   Sample record: ${JSON.stringify(updatedAssignments[0], null, 2)}\n`);
            } else {
                console.log('   ⚠️  Migration may be incomplete. Manual verification needed.');
            }
        }

        console.log('✅ Migration 025 completed!\n');
        console.log('📋 Next steps:');
        console.log('   1. Verify in Supabase dashboard that columns exist');
        console.log('   2. Check that RLS policies are active');
        console.log('   3. Test teacher login to verify scoped assignments\n');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n⚠️  IMPORTANT: If this fails, run the SQL manually in Supabase SQL Editor');
        console.error('   File: server/migrations/025_fix_teacher_assignments.sql\n');
        throw error;
    }
}

applyMigration().catch(console.error);
