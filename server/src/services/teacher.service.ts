import { supabase } from '../config/supabase';

export const TeacherService = {
    // Admin: Create Teacher Record
    async create(data: { first_name: string; last_name: string; email: string; staff_id?: string; phone?: string; status?: string }) {
        // Prevent duplicate emails
        const { data: existing } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', data.email)
            .maybeSingle();

        if (existing) {
            throw new Error('Teacher with this email already exists.');
        }

        const { data: teacher, error } = await supabase
            .from('teachers')
            .insert({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                staff_id: data.staff_id,
                phone: data.phone,
                status: data.status || 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return teacher;
    },

    // Admin: Get All Teachers with Filters
    async getAll(filters?: { status?: string; search?: string }) {
        let query = supabase
            .from('teachers')
            .select(`
                *,
                teacher_assignments(count)
            `);

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,staff_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('last_name', { ascending: true });
        if (error) throw error;

        // Flatten assignment count
        return data.map(t => ({
            ...t,
            assignment_count: t.teacher_assignments?.[0]?.count || 0
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('teachers')
            .select(`
                *,
                auth_user:users ( email, first_name, last_name )
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async getByAuthId(authUserId: string) {
        // PRODUCTION-CRITICAL: Get active session first
        const { data: activeSession, error: sessionError } = await supabase
            .from('sessions')
            .select('id')
            .eq('is_active', true)
            .maybeSingle();

        if (sessionError) {
            throw new Error(`Failed to fetch active session: ${sessionError.message}`);
        }

        if (!activeSession) {
            throw new Error('No active academic session found. Contact administrator.');
        }

        const { data, error } = await supabase
            .from('teachers')
            .select(`
                *,
                auth_user:users ( email, first_name, last_name ),
                assignments:teacher_assignments (
                    id,
                    class_id,
                    subject_id,
                    academic_session_id,
                    is_active,
                    classes ( id, name ),
                    subjects ( id, name, code )
                )
            `)
            .eq('auth_user_id', authUserId)
            .maybeSingle();

        if (error) throw error;

        // PRODUCTION-CRITICAL: Filter assignments to active session only
        if (data && data.assignments) {
            data.assignments = data.assignments.filter((a: any) =>
                a.academic_session_id === activeSession.id && a.is_active === true
            );
        }

        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('teachers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        // Soft delete / deactivate
        const { data, error } = await supabase
            .from('teachers')
            .update({ status: 'inactive' })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Assignments
    async assign(teacherId: string, classId: string, subjectId: string) {
        // PRODUCTION-CRITICAL: Get active session
        const { data: activeSession, error: sessionError } = await supabase
            .from('sessions')
            .select('id')
            .eq('is_active', true)
            .maybeSingle();

        if (sessionError) {
            throw new Error(`Failed to fetch active session: ${sessionError.message}`);
        }

        if (!activeSession) {
            throw new Error('No active academic session found. Cannot create assignment.');
        }

        // Check if assignment already exists for this session
        const { data: existing } = await supabase
            .from('teacher_assignments')
            .select('id')
            .match({
                teacher_id: teacherId,
                class_id: classId,
                subject_id: subjectId,
                academic_session_id: activeSession.id
            })
            .maybeSingle();

        if (existing) {
            throw new Error('Teacher is already assigned to this subject in this class for the current session.');
        }

        const { data, error } = await supabase
            .from('teacher_assignments')
            .insert({
                teacher_id: teacherId,
                class_id: classId,
                subject_id: subjectId,
                academic_session_id: activeSession.id,  // REQUIRED
                is_active: true  // Default to active
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAssignments(teacherId: string) {
        const { data, error } = await supabase
            .from('teacher_assignments')
            .select(`
                id,
                classes ( id, name ),
                subjects ( id, name, code )
            `)
            .eq('teacher_id', teacherId);

        if (error) throw error;
        return data || [];
    },

    async removeAssignment(assignmentId: string) {
        const { error } = await supabase
            .from('teacher_assignments')
            .delete()
            .eq('id', assignmentId);
        if (error) throw error;
        return true;
    }
};
