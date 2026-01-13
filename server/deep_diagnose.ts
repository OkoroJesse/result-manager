import { supabase } from './src/config/supabase';

async function deepDiagnose() {
    console.log('--- Deep Diagnose ---');

    // 1. Try a request specifically for the status column
    console.log('\nChecking "status" column specifically via filter...');
    const { data: d1, error: e1 } = await supabase
        .from('terms')
        .select('id, name, status')
        .limit(1);

    if (e1) {
        console.error('FAILED to select "status" column!');
        console.error('Message:', e1.message);
        console.error('Code:', e1.code);
        console.error('Hint:', e1.hint);
    } else {
        console.log('SUCCESS: "status" column is readable.');
        console.log('Row sample:', d1[0]);
    }

    // 2. Try an update on the status column
    console.log('\nAttempting to update "status" of a random term...');
    const { data: terms } = await supabase.from('terms').select('id').limit(1);
    if (terms && terms.length > 0) {
        const id = terms[0].id;
        console.log(`Updating term ${id}...`);
        const { error: e2 } = await supabase
            .from('terms')
            .update({ status: 'draft' })
            .eq('id', id);

        if (e2) {
            console.error('FAILED to update "status" column!');
            console.error('Message:', e2.message);
        } else {
            console.log('SUCCESS: "status" column is writable.');
        }
    } else {
        console.log('No terms found to test update.');
    }
}

deepDiagnose();
