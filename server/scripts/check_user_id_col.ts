
import { supabase } from '../src/config/supabase';

async function checkUserIdColumn() {
    const { data, error } = await supabase.from('teachers').select('user_id').limit(1);

    if (error) {
        console.log('Error selecting user_id:', error.message);
    } else {
        console.log('Selection success, data:', data);
    }
}
checkUserIdColumn();
