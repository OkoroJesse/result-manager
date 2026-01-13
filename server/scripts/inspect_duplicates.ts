
import { supabase } from '../src/config/supabase';

async function inspectClasses() {
    console.log('Inspecting classes table for duplicates...');

    // Fetch all classes
    const { data: classes, error } = await supabase.from('classes').select('*');

    if (error) {
        console.error('Error fetching classes:', error);
        return;
    }

    if (!classes || classes.length === 0) {
        console.log('No classes found.');
        return;
    }

    console.log(`Found ${classes.length} classes.`);
    console.table(classes.map(c => ({
        id: c.id,
        name: c.name,
        // Check which column exists based on what migration phase passed
        numeric_level: c.numeric_level || c.level,
        level_category: c.level // This might be the new column if it exists, or the old one if rename failed? 
        // Actually if rename happened, 'level' in response might be undefined if we query '*', depends on PostgREST
    })));

    // Group by numeric_level/level to see duplicates
    const counts: Record<number, string[]> = {};
    classes.forEach((c: any) => {
        const val = c.numeric_level !== undefined ? c.numeric_level : c.level;
        if (!counts[val]) counts[val] = [];
        counts[val].push(c.name);
    });

    console.log('\nDuplicates Analysis:');
    Object.entries(counts).forEach(([val, names]) => {
        if (names.length > 1) {
            console.log(`Level ${val}: Shared by [${names.join(', ')}]`);
        }
    });
}

inspectClasses();
