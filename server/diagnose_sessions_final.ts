import { SessionService } from './src/services/session.service';
import { supabase } from './src/config/supabase';

async function diagnose() {
    try {
        console.log('\n--- 🔍 SESSION SERVICE DIAGNOSIS ---');
        const active = await SessionService.getActive();
        console.log('SessionService.getActive() returned:', active);

        console.log('\n--- 📂 DATABASE CONSTRAINTS CHECK ---');
        const { data: constraints, error } = await supabase.rpc('inspect_foreign_keys', { t_name: 'results' });
        if (error) {
            console.log('RPC inspect_foreign_keys failed, trying manual query...');
            const { data: raw, error: rawError } = await supabase.from('results').select('id, session_id').limit(1);
            console.log('Sample result entry:', raw?.[0]);
        } else {
            console.log('Constraints:', constraints);
        }

        // Check if academic_sessions and sessions have same names but different IDs
        const { data: acad } = await supabase.from('academic_sessions').select('id, name').eq('is_active', true);
        const { data: sess } = await supabase.from('sessions').select('id, name').eq('is_active', true);

        console.log('\nActive in academic_sessions:', acad);
        console.log('Active in sessions:', sess);

    } catch (e) {
        console.error(e);
    }
}
diagnose();
