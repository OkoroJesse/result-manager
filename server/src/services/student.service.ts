import { supabase } from '../config/supabase';

export const StudentService = {
    async getAll(filters?: { class_id?: string; status?: string; search?: string }) {
        let query = supabase
            .from('students')
            .select(`
                *,
                classes (name)
            `);

        if (filters?.class_id) {
            query = query.eq('class_id', filters.class_id);
        }

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,admission_number.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('last_name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                classes (name),
                auth_user:users (email)
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(studentData: any) {
        // Admission number uniqueness is handled by DB constraint, 
        // but we could check here for better error message.
        const { data, error } = await supabase.from('students').insert(studentData).select().single();
        if (error) {
            if (error.code === '23505') throw new Error('Admission number already exists');
            throw error;
        }
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        // Soft delete/deactivation by setting status to withdrawn
        const { data, error } = await supabase.from('students').update({ status: 'withdrawn' }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};
