import { supabase } from '../config/supabase';

export const SessionService = {
    async getAll() {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .order('start_date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getActive() {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async create(data: { name: string; start_date: string; end_date: string }) {
        // Prevent overlapping dates (basic check)
        const { data: existing } = await supabase
            .from('sessions')
            .select('id')
            .or(`and(start_date.lte.${data.start_date},end_date.gte.${data.start_date}),and(start_date.lte.${data.end_date},end_date.gte.${data.end_date})`);

        // Note: PostgREST complex ORs can be tricky. We'll rely on the DB's transactional nature 
        // and ideally a constraint or trigger for overlapping check if needed, 
        // but here we'll just insert and handle the unique name conflict.

        const { data: session, error } = await supabase
            .from('sessions')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return session;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('sessions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async activate(id: string) {
        // Use RPC for transactional switch
        const { error } = await supabase.rpc('fn_activate_session', { target_session_id: id });
        if (error) throw error;
        return true;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};
