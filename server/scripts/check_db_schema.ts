import { supabase } from '../src/config/supabase';

async function checkColumns() {
    try {
        const { data, error } = await supabase.from('classes').select('*').limit(1);
        if (error) throw error;

        if (data && data.length > 0) {
            console.log('CLASS_COLUMNS:', Object.keys(data[0]));
        } else {
            console.log('CLASS_TABLE_EMPTY');
            // Try fetch metadata if possible or just check a student record
            const { data: sData } = await supabase.from('students').select('*').limit(1);
            if (sData) console.log('STUDENT_COLUMNS:', Object.keys(sData[0]));
        }
    } catch (err) {
        console.error('ERROR:', err);
    }
}

checkColumns();
