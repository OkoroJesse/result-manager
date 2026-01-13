import { supabase } from '../config/supabase';

export const PromotionService = {
    /**
     * Batch promotes students from one class in a session to a new class in the next session.
     */
    async promoteBatch(params: {
        sessionFromId: string;
        sessionToId: string;
        classFromId: string;
        classToId: string;
        adminId: string;
        status?: 'promoted' | 'repeated';
    }) {
        const { sessionFromId, sessionToId, classFromId, classToId, adminId, status = 'promoted' } = params;

        // 1. Fetch all students currently in the source class
        const { data: students, error: fetchError } = await supabase
            .from('students')
            .select('id, class_id')
            .eq('class_id', classFromId);

        if (fetchError) throw fetchError;
        if (!students || students.length === 0) {
            throw new Error('No students found in the selected source class.');
        }

        // 2. Process Promotions (Batch)
        // Note: Simple loop for now. In a massive school, we might want a DB function (RPC).
        const errors = [];
        let successCount = 0;

        for (const student of students) {
            try {
                // a. Archive OLD status in history if not already present
                await supabase.from('student_class_history').upsert({
                    student_id: student.id,
                    session_id: sessionFromId,
                    class_id: classFromId,
                    status: 'promoted', // Final status for the old session
                    promoted_by: adminId
                }, { onConflict: 'student_id,session_id' });

                // b. Update current class in students table
                const { error: updateError } = await supabase
                    .from('students')
                    .update({ class_id: classToId })
                    .eq('id', student.id);

                if (updateError) throw updateError;

                // c. Create NEW session record in history
                const { error: historyError } = await supabase
                    .from('student_class_history')
                    .insert({
                        student_id: student.id,
                        session_id: sessionToId,
                        class_id: classToId,
                        status: status === 'promoted' ? 'promoted' : 'repeated',
                        promoted_by: adminId
                    });

                if (historyError) throw historyError;

                successCount++;
            } catch (err: any) {
                console.error(`Promotion failed for student ${student.id}:`, err);
                errors.push({ studentId: student.id, error: err.message });
            }
        }

        // 3. Log the Batch Action
        await supabase.from('academic_promotions').insert({
            session_from_id: sessionFromId,
            session_to_id: sessionToId,
            class_from_id: classFromId,
            class_to_id: classToId,
            student_count: successCount,
            created_by: adminId
        });

        return {
            success: successCount,
            failed: errors.length,
            errors
        };
    },

    async getPromotionHistory() {
        const { data, error } = await supabase
            .from('academic_promotions')
            .select(`
                *,
                session_from:sessions!session_from_id(name),
                session_to:sessions!session_to_id(name),
                class_from:classes!class_from_id(name),
                class_to:classes!class_to_id(name),
                admin:users!created_by(first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getStudentHistory(studentId: string) {
        const { data, error } = await supabase
            .from('student_class_history')
            .select(`
                *,
                session:sessions(name),
                class:classes(name),
                admin:users!promoted_by(first_name, last_name)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
