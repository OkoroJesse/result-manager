import { supabase } from '../config/supabase';

export const TermService = {
    async getAll(sessionId?: string) {
        let query = supabase.from('terms').select('*');
        if (sessionId) query = query.eq('session_id', sessionId);

        const { data, error } = await query.order('order', { ascending: true });
        if (error) throw error;
        return data;
    },

    async getActive(sessionId?: string) {
        let query = supabase.from('terms').select('*').eq('is_active', true);
        if (sessionId) query = query.eq('session_id', sessionId);

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data;
    },

    async create(data: { name: string; order: number; start_date: string; end_date: string; session_id: string; status?: string }) {
        // 1. Validate term dates are within session dates
        const { data: session } = await supabase
            .from('sessions')
            .select('name, start_date, end_date')
            .eq('id', data.session_id)
            .single();

        if (!session) throw new Error('Parent session not found');

        const termStart = new Date(data.start_date);
        const termEnd = new Date(data.end_date);
        const sessStart = new Date(session.start_date!);
        const sessEnd = new Date(session.end_date!);

        if (termStart < sessStart || termEnd > sessEnd) {
            throw new Error(`Term dates must fall within session dates (${session.start_date} to ${session.end_date} for ${session.name})`);
        }

        if (termEnd <= termStart) {
            throw new Error('End date must be after start date');
        }

        // 2. Check for duplicate term names per session
        const { data: existing } = await supabase
            .from('terms')
            .select('id')
            .eq('session_id', data.session_id)
            .eq('name', data.name)
            .maybeSingle();

        if (existing) {
            throw new Error(`A term named "${data.name}" already exists for this session.`);
        }

        const { data: term, error } = await supabase
            .from('terms')
            .insert({
                ...data,
                status: data.status || 'draft',
                is_active: false // Explicitly false on create
            })
            .select()
            .single();

        if (error) throw error;
        return term;
    },

    async update(id: string, updates: any) {
        // 1. If dates are being updated, we need to validate them
        if (updates.start_date || updates.end_date || updates.session_id) {
            // Get current term data to fill in gaps
            const { data: currentTerm } = await supabase.from('terms').select('*').eq('id', id).single();
            if (!currentTerm) throw new Error('Term not found');

            const sessionId = updates.session_id || currentTerm.session_id;
            const startDate = updates.start_date || currentTerm.start_date;
            const endDate = updates.end_date || currentTerm.end_date;

            const { data: session } = await supabase
                .from('sessions')
                .select('name, start_date, end_date')
                .eq('id', sessionId)
                .single();

            if (session) {
                const termStart = new Date(startDate);
                const termEnd = new Date(endDate);
                const sessStart = new Date(session.start_date!);
                const sessEnd = new Date(session.end_date!);

                if (termStart < sessStart || termEnd > sessEnd) {
                    throw new Error(`Updated dates must fall within session dates (${session.start_date} to ${session.end_date} for ${session.name})`);
                }
                if (termEnd <= termStart) {
                    throw new Error('End date must be after start date');
                }
            }
        }

        const { data, error } = await supabase
            .from('terms')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async activate(id: string) {
        // Use RPC for transactional activation and validation (includes session active check)
        const { error } = await supabase.rpc('fn_activate_term', { target_term_id: id });
        if (error) throw error;
        return true;
    },

    async delete(id: string) {
        // DB Trigger 'trigger_prevent_term_deletion' will catch results dependency
        const { error } = await supabase
            .from('terms')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.message.includes('Results are already linked')) {
                throw new Error('Cannot delete term: Students already have results recorded for this term.');
            }
            throw error;
        }
        return true;
    },

    async close(id: string) {
        // 1. Check if term exists
        const { data: term, error: fetchError } = await supabase
            .from('terms')
            .select('status, is_active')
            .eq('id', id)
            .single();

        if (fetchError || !term) throw new Error('Term not found');

        // 2. Update status to closed and ensure is_active is false
        // Trigger 'trigger_prevent_closed_term_results' in DB will ensure future immutability
        const { error: updateError } = await supabase
            .from('terms')
            .update({ status: 'closed', is_active: false })
            .eq('id', id);

        if (updateError) throw updateError;
        return true;
    }
};
