import { supabase } from './src/config/supabase';

async function inspectSchema() {
    console.log('Inspecting terms table schema...');

    // Query information_schema via RPC or just try to select
    // Since we don't have a direct SQL executor, we can try to select and see what keys are returned
    // OR we can query a view if it exists.

    try {
        const { data, error } = await supabase
            .from('terms')
            .select('*')
            .limit(1);

        if (error) {
            console.log('Error selecting from terms:', error.message);
            console.log('Error details:', error);
        } else {
            console.log('Successfully selected from terms.');
            if (data && data.length > 0) {
                console.log('Columns found:', Object.keys(data[0]));
            } else {
                console.log('Table is empty, cannot detect columns this way.');
            }
        }
    } catch (err) {
        console.error('Inspection failed:', err);
    }
}

inspectSchema();
