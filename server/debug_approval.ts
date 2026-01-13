import { supabase } from './src/config/supabase';

async function testGetSubmitted() {
    console.log('--- Testing getSubmitted Query ---');

    const sessionId = 'fb252ada-2cf7-44a4-84ec-5f092a216c39'; // From user screenshot
    const termId = '84ec-5f092a216c39'; // Partial ID from screenshot (likely incomplete, let's fetch active one)

    // 1. Get an active session and term if the above are placeholders
    const { data: activeSession } = await supabase.from('academic_sessions').select('id').eq('is_active', true).single();
    const { data: activeTerm } = await supabase.from('terms').select('id').eq('is_active', true).single();

    const sId = activeSession?.id || sessionId;
    const tId = activeTerm?.id || termId;

    console.log(`Using Session: ${sId}, Term: ${tId}`);

    // 2. Try the full query that's failing
    const { data, error } = await supabase
        .from('results')
        .select(`
            *,
            classes(name),
            subjects(name),
            teachers(id, users(first_name, last_name))
        `)
        .eq('session_id', sId)
        .eq('term_id', tId)
        .limit(1);

    if (error) {
        console.error('❌ Query FAILED!');
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);

        // 3. Drill down to identify which part is failing
        console.log('\n--- Debugging Components ---');

        // Check simple select
        const { error: e1 } = await supabase.from('results').select('id').limit(1);
        console.log('Simple Select:', e1 ? 'FAIL' : 'OK');

        // Check classes valid
        const { error: e2 } = await supabase.from('results').select('classes(name)').limit(1);
        console.log('Classes Relation:', e2 ? `FAIL: ${e2.message}` : 'OK');

        // Check subjects valid
        const { error: e3 } = await supabase.from('results').select('subjects(name)').limit(1);
        console.log('Subjects Relation:', e3 ? `FAIL: ${e3.message}` : 'OK');

        // Check teachers relation (likely culprit)
        const { error: e4 } = await supabase.from('results').select('teachers(id)').limit(1);
        console.log('Teachers Relation:', e4 ? `FAIL: ${e4.message}` : 'OK');

        // Check deep nested users relation
        const { error: e5 } = await supabase.from('teachers').select('users(first_name)').limit(1);
        console.log('Teachers -> Users Relation:', e5 ? `FAIL: ${e5.message}` : 'OK');
    } else {
        console.log('✅ Query SUCCESS!');
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

testGetSubmitted();
