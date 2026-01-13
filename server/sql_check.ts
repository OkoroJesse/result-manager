import { supabase } from './src/config/supabase';

async function sqlCheck() {
    console.log('--- SQL Catalog Check ---');

    // We use a trick: try to call a non-existent RPC or use an existing one to run raw SQL?
    // Actually, we can check if the column exists by trying to use it in a filter with raw() if available
    // But supabase-js doesn't support raw SQL easily.

    // Let's try to fetch information_schema via a view if it exists, but likely it doesn't.
    // Let's try to query 'terms' and see if we can get the error details.

    const { data, error } = await supabase
        .from('terms')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Core Error:', error.message);
        console.error('Details:', error.details);
    } else {
        console.log('Successful select *');
        console.log('Available columns:', Object.keys(data[0] || {}));
    }
}

sqlCheck();
