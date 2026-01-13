import { supabase } from '../config/supabase';

export const SubjectService = {
    async getAll() {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name');
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(data: { name: string; code?: string; category: string; status?: string }) {
        const { data: subject, error } = await supabase
            .from('subjects')
            .insert({
                name: data.name,
                code: data.code,
                category: data.category,
                status: data.status || 'active'
            })
            .select()
            .single();
        if (error) throw error;
        return subject;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('subjects')
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
            .from('subjects')
            .update({ status: 'inactive' })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Class Subjects Junction Logic
    async getByClass(classId: string) {
        const { data, error } = await supabase
            .from('class_subjects')
            .select(`
                id,
                is_compulsory,
                created_at,
                subjects (*)
            `)
            .eq('class_id', classId);

        if (error) throw error;

        // Flatten to make it easier for frontend
        return data.map((item: any) => ({
            assignment_id: item.id,
            is_compulsory: item.is_compulsory,
            ...item.subjects
        }));
    },

    async assignToClass(classId: string, data: { subject_id: string; is_compulsory?: boolean }) {
        // Prevent duplicates
        const { data: existing } = await supabase
            .from('class_subjects')
            .select('id')
            .match({ class_id: classId, subject_id: data.subject_id })
            .maybeSingle();

        if (existing) {
            throw new Error('Subject is already assigned to this class.');
        }

        const { data: assignment, error } = await supabase
            .from('class_subjects')
            .insert({
                class_id: classId,
                subject_id: data.subject_id,
                is_compulsory: data.is_compulsory ?? true
            })
            .select()
            .single();

        if (error) throw error;
        return assignment;
    },

    async removeFromClass(assignmentId: string) {
        const { error } = await supabase
            .from('class_subjects')
            .delete()
            .eq('id', assignmentId);
        if (error) throw error;
        return true;
    },

    async updateAssignment(assignmentId: string, updates: { is_compulsory: boolean }) {
        const { data, error } = await supabase
            .from('class_subjects')
            .update(updates)
            .eq('id', assignmentId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};
