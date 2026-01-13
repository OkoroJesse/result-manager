import { supabase } from '../config/supabase';

export const ResultService = {
    async upsertResult(data: any, teacherId?: string) {
        // Enforce teacher context if provided
        const payload = { ...data };
        if (teacherId) payload.entered_by = teacherId;

        const { data: result, error } = await supabase
            .from('results')
            .upsert(payload, {
                onConflict: 'student_id, subject_id, session_id, term_id'
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async getByContext(params: { session_id: string; term_id: string; class_id: string; subject_id: string; status?: string }) {
        let query = supabase
            .from('results')
            .select(`
                *,
                students (
                    id, 
                    admission_number,
                    first_name,
                    last_name
                ),
                entered_by_teacher:teachers!entered_by(id, first_name, last_name),
                approved_by_user:users!approved_by(id, first_name, last_name)
            `)
            .eq('session_id', params.session_id)
            .eq('term_id', params.term_id)
            .eq('class_id', params.class_id)
            .eq('subject_id', params.subject_id);

        if (params.status) {
            query = query.eq('status', params.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async submitResults(session_id: string, term_id: string, class_id: string, subject_id: string, teacher_id: string) {
        // PRODUCTION-CRITICAL: Verify teacher assignment

        const { data: assignment, error: assignmentError } = await supabase
            .from('teacher_assignments')
            .select('id')
            .match({
                teacher_id,
                class_id,
                subject_id,
                academic_session_id: session_id,
                is_active: true
            })
            .maybeSingle();

        if (assignmentError) {
            throw new Error(`Assignment verification failed: ${assignmentError.message}`);
        }

        if (!assignment) {
            throw new Error('You are not assigned to teach this subject in this class');
        }

        // PRODUCTION-CRITICAL: Verify all active students have results
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id')
            .eq('class_id', class_id)
            .eq('status', 'active');

        if (studentsError) {
            throw new Error(`Failed to fetch students: ${studentsError.message}`);
        }

        const { data: results, error: resultsError } = await supabase
            .from('results')
            .select('student_id')
            .match({ session_id, term_id, class_id, subject_id, status: 'draft' });

        if (resultsError) {
            throw new Error(`Failed to fetch results: ${resultsError.message}`);
        }

        const studentIds = students?.map(s => s.id) || [];
        const resultStudentIds = results?.map(r => r.student_id) || [];

        const missing = studentIds.filter(id => !resultStudentIds.includes(id));
        if (missing.length > 0) {
            throw new Error(`Cannot submit: ${missing.length} student(s) missing results`);
        }

        // PRODUCTION-CRITICAL: Submit with teacher ownership enforcement
        const { data, error } = await supabase
            .from('results')
            .update({ status: 'submitted' })
            .match({
                session_id,
                term_id,
                class_id,
                subject_id,
                status: 'draft',
                entered_by: teacher_id  // ENFORCE OWNERSHIP
            })
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('No results found to submit. Ensure you have entered results for all students.');
        }

        return data;
    },

    async approveResults(resultIds: string[], adminProfileId: string) {
        const { data, error } = await supabase
            .from('results')
            .update({
                status: 'approved',
                approved_by: adminProfileId
            })
            .in('id', resultIds)
            .eq('status', 'submitted')
            .select();

        if (error) throw error;
        return data;
    },

    async rejectResults(resultIds: string[]) {
        const { data, error } = await supabase
            .from('results')
            .update({ status: 'draft' }) // Return to draft
            .in('id', resultIds)
            .eq('status', 'submitted')
            .select();

        if (error) throw error;
        return data;
    },

    async getDrafts(session_id: string, term_id: string) {
        const { data, error } = await supabase
            .from('results')
            .select('*, classes(name), subjects(name)')
            .eq('session_id', session_id)
            .eq('term_id', term_id)
            .eq('status', 'draft');

        if (error) throw error;
        return data;
    },

    async getSubmitted(session_id: string, term_id: string) {
        const { data, error } = await supabase
            .from('results')
            .select(`
                *,
                classes(name),
                subjects(name),
                teachers!entered_by(id, users(first_name, last_name))
            `)
            .eq('session_id', session_id)
            .eq('term_id', term_id)
            .eq('status', 'submitted');

        if (error) throw error;
        return data;
    },

    async getGradingScales() {
        const { data, error } = await supabase
            .from('grading_scales')
            .select('*')
            .order('min_score', { ascending: false });
        if (error) throw error;
        return data;
    },

    // PRODUCTION-CRITICAL: Get submitted results grouped for admin approval
    async getSubmittedGrouped(session_id: string, term_id: string) {
        const { data, error } = await supabase
            .from('results')
            .select(`
                class_id,
                subject_id,
                entered_by,
                classes(name),
                subjects(name),
                teachers!entered_by(id, first_name, last_name)
            `)
            .eq('session_id', session_id)
            .eq('term_id', term_id)
            .eq('status', 'submitted');

        if (error) throw error;

        // Group by unique submissions (class + subject + teacher)
        const grouped = new Map();
        data?.forEach((r: any) => {
            const key = `${r.class_id}-${r.subject_id}-${r.entered_by}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    class_id: r.class_id,
                    subject_id: r.subject_id,
                    teacher_id: r.entered_by,
                    class_name: r.classes?.name || 'Unknown Class',
                    subject_name: r.subjects?.name || 'Unknown Subject',
                    teacher_name: r.teachers ? `${r.teachers.first_name} ${r.teachers.last_name}` : 'Unknown Teacher'
                });
            }
        });

        return Array.from(grouped.values());
    }
};
