import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { z } from 'zod';

const approvalActionSchema = z.object({
    session_id: z.string().uuid(),
    term_id: z.string().uuid(),
    class_id: z.string().uuid().optional(), // Optional: publish specific class or all
});

export const ResultApprovalController = {
    // Promote Draft -> Approved
    async approveResults(req: Request, res: Response) {
        try {
            const validated = approvalActionSchema.parse(req.body);

            let query = supabase.from('results').update({ status: 'approved' })
                .eq('session_id', validated.session_id)
                .eq('term_id', validated.term_id)
                .eq('status', 'draft'); // Only promote drafts

            if (validated.class_id) {
                query = query.eq('class_id', validated.class_id);
            }

            const { error, data } = await query.select();
            const count = data?.length || 0;

            if (error) throw error;
            res.json({ message: 'Results approved successfully', count });

        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Approval failed' });
        }
    },

    // Promote Approved -> Published
    async publishResults(req: Request, res: Response) {
        try {
            const validated = approvalActionSchema.parse(req.body);

            let query = supabase.from('results').update({ status: 'published' })
                .eq('session_id', validated.session_id)
                .eq('term_id', validated.term_id)
                .eq('status', 'approved'); // Only promote approved

            if (validated.class_id) {
                query = query.eq('class_id', validated.class_id);
            }

            const { error, data } = await query.select();
            const count = data?.length || 0;

            if (error) throw error;
            res.json({ message: 'Results published successfully', count });

        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Publishing failed' });
        }
    },

    // OPTIONAL: Revert Approved -> Draft (Admin only)
    async revertToDraft(req: Request, res: Response) {
        try {
            const validated = approvalActionSchema.parse(req.body);

            // Can only revert 'approved' results. 'published' are immutable.
            let query = supabase.from('results').update({ status: 'draft' })
                .eq('session_id', validated.session_id)
                .eq('term_id', validated.term_id)
                .eq('status', 'approved');

            if (validated.class_id) {
                query = query.eq('class_id', validated.class_id);
            }

            const { error, data } = await query.select();
            const count = data?.length || 0;
            if (error) throw error;
            res.json({ message: 'Results reverted to draft', count });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};
