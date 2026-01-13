import { supabase } from '../config/supabase';

export const GradingRuleService = {
    async getAll() {
        const { data, error } = await supabase.from('grading_rules').select('*').order('min_score', { ascending: false });
        if (error) throw error;
        return data;
    },

    async create(ruleData: any) {
        // Validate range overlap could be here, but rule said NO business logic, just CRUD.
        const { data, error } = await supabase.from('grading_rules').insert(ruleData).select().single();
        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase.from('grading_rules').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase.from('grading_rules').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};
