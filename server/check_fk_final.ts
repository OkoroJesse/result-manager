import { supabase } from './src/config/supabase';

async function checkFK() {
    try {
        console.log('\n--- 📂 CHECKING FOREIGN KEY FOR results.session_id ---');

        // This is a common way to find what a foreign key points to in Postgres
        const sql = `
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='results' AND kcu.column_name='session_id';
        `;

        // We can't run raw SQL directly via the client without an RPC.
        // Let's assume the user has a 'exec_sql' or similar, but if not, 
        // we'll try to find a proxy.

        console.log('Attempting to find table name of the foreign key...');

        // Plan B: Try to insert a dummy value and see the error message details? No, too risky.
        // Plan C: Check the migration history carefully.

        const { data: results, error } = await supabase.from('results').select('session_id').limit(1);
        console.log('Existing results have session_id:', results?.[0]?.session_id);

        if (results?.[0]?.session_id) {
            const id = results[0].session_id;
            const { data: s } = await supabase.from('sessions').select('id, name').eq('id', id).maybeSingle();
            const { data: a } = await supabase.from('academic_sessions').select('id, name').eq('id', id).maybeSingle();

            console.log(`Current results session_id [${id}] matches:`);
            console.log(`- sessions table: ${s ? s.name : 'NO'}`);
            console.log(`- academic_sessions table: ${a ? a.name : 'NO'}`);
        }

    } catch (e) {
        console.error(e);
    }
}
checkFK();
