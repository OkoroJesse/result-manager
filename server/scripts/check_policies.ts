
import { supabase } from '../src/config/supabase';

async function checkPolicies() {
    console.log('Checking RLS policies for tables...');

    // We can't easily query pg_policies via supabase-js client unless we have a function or direct SQL access.
    // Instead, let's try to select from 'roles' as an authenticated user context if possible, 
    // but here we are running as service_role (likely) so we will see everything.

    // Actually, let's just inspect the roles table to see if RLS is enabled.
    // We can assume RLS is enabled if we can't see it from client.

    // Let's try to just insert a policy? No.

    // Better approach: Let's just Apply a fix policy that allows reading roles.
    // If the user can't see "teacher" in the UI, but the DB has it, it's 99% RLS.
    // The "roles" table should be public read.

    console.log('Attempting to check if roles table is readable...');
    const { data, error } = await supabase.from('roles').select('*').limit(5);
    if (error) {
        console.error('Error reading roles:', error);
    } else {
        console.log('Roles found:', data);
    }

}

checkPolicies();
