import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function manualCleanup() {
    console.log('1. Standardizing Primary 2 class name...');
    const { data: classUpdate, error: classError } = await supabase
        .from('classes')
        .update({ name: 'Primary 2' })
        .eq('name', 'primary 2')
        .select();

    if (classError) console.error('Class update error:', classError);
    else console.log('Class updated:', classUpdate);

    console.log('2. Standardizing Chelsea Okoro profile name...');
    const { data: userUpdate, error: userError } = await supabase
        .from('users')
        .update({ first_name: 'Chelsea', last_name: 'Okoro' })
        .eq('email', 'chelsea001@gmail.com')
        .select();

    if (userError) console.error('User update error:', userError);
    else console.log('User updated:', userUpdate);
}

manualCleanup().catch(console.error);
