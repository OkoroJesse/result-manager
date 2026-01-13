import { supabase } from '../config/supabase';

export const ClassService = {
    async getAll() {
        const { data, error } = await supabase.from('classes').select('*').order('numeric_level', { ascending: true });
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async create(classData: any) {
        const { data, error } = await supabase.from('classes').insert(classData).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('classes').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};
