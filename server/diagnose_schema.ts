import { supabase } from './src/config/supabase';

async function diagnose() {
    console.log('Testing Supabase queries...');

    // 1. Test selecting all columns from terms
    console.log('\n--- Test 1: Select * from terms ---');
    const { data: d1, error: e1 } = await supabase.from('terms').select('*').limit(1);
    if (e1) {
        console.error('Error in Test 1:', e1.message);
        console.error('Code:', e1.code);
        console.error('Hint:', e1.hint);
        console.error('Details:', e1.details);
    } else {
        console.log('Test 1 Success! Columns:', d1.length > 0 ? Object.keys(d1[0]) : 'Empty table');
    }

    // 2. Test specific column selection
    console.log('\n--- Test 2: Select session_id from terms ---');
    const { data: d2, error: e2 } = await supabase.from('terms').select('session_id').limit(1);
    if (e2) {
        console.error('Error in Test 2:', e2.message);
        console.error('Code:', e2.code);
    } else {
        console.log('Test 2 Success!');
    }

    // 3. Test academic_sessions
    console.log('\n--- Test 3: Select * from academic_sessions ---');
    const { data: d3, error: e3 } = await supabase.from('academic_sessions').select('*').limit(1);
    if (e3) {
        console.error('Error in Test 3:', e3.message);
    } else {
        console.log('Test 3 Success! Columns:', d3.length > 0 ? Object.keys(d3[0]) : 'Empty table');
    }
}

diagnose();
