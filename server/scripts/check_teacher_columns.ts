
import { supabase } from '../src/config/supabase';

async function checkColumns() {
    const { data, error } = await supabase.from('teachers').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Teacher Columns:', Object.keys(data[0]));
    } else {
        console.log('No teachers found or error', error);
    }
}
checkColumns();
