
import { supabase } from '../src/config/supabase';
import fs from 'fs';
import path from 'path';

async function debugTeacherFail() {
    const logPath = path.join(__dirname, 'teacher_debug.log');
    const log = (msg: string) => fs.appendFileSync(logPath, msg + '\n');
    fs.writeFileSync(logPath, 'START DEBUG\n');

    // 1. Check if table exists
    log('Checking table existence...');
    const { data, error } = await supabase.from('teachers').select('*').limit(1);

    if (error) {
        log('Table Access Error: ' + JSON.stringify(error, null, 2));
    } else {
        log('Table Exists. Rows found: ' + (data?.length || 0));
    }

    // 2. Try Insert (Simulate flow)
    log('Trying Insert...');
    // We need a valid user ID. Let's list users.
    const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
    if (uErr) {
        log('Auth List Error: ' + JSON.stringify(uErr));
        return;
    }
    const user = users[0];
    if (!user) {
        log('No auth users to test with.');
        return;
    }

    const { error: iErr } = await supabase.from('teachers').insert({
        id: user.id,
        full_name: 'Debug Teacher',
        email: user.email,
        staff_id: 'DEBUG-01'
    });

    if (iErr) {
        log('Insert Error: ' + JSON.stringify(iErr, null, 2));
    } else {
        log('Insert Success!');
        // cleanup
        await supabase.from('teachers').delete().eq('id', user.id);
    }
}

debugTeacherFail();
