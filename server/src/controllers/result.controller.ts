import { Request, Response } from 'express';
import { ResultService } from '../services/result.service';
import { AssignmentService } from '../services/assignment.service';
import { createResultSchema } from '../validators/result.schema';
import { supabase } from '../config/supabase';

export const ResultController = {
    // Save Result (Upsert) - Teachers Only
    async saveResult(req: any, res: Response) {
        try {
            const user = req.user;
            const validated = createResultSchema.parse(req.body);

            // 1. Get Teacher Profile
            const { data: teacher } = await supabase.from('teachers').select('id').eq('auth_user_id', user.id).single();

            if (teacher) {
                // Check if teacher is assigned to this class and subject
                const isAssigned = await AssignmentService.checkAssignment(teacher.id, validated.class_id, validated.subject_id);
                if (!isAssigned) {
                    return res.status(403).json({ error: 'You are not assigned to this class and subject' });
                }
            } else if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized to enter results' });
            }

            // 2. Check current status
            const { data: currentResult } = await supabase.from('results')
                .select('status')
                .match({
                    student_id: validated.student_id,
                    subject_id: validated.subject_id,
                    session_id: validated.session_id,
                    term_id: validated.term_id
                })
                .maybeSingle();

            if (currentResult && currentResult.status !== 'draft') {
                return res.status(403).json({ error: `Cannot edit ${currentResult.status} results.` });
            }

            const saved = await ResultService.upsertResult(validated, teacher?.id);
            res.json(saved);

        } catch (error: any) {
            console.error('[ResultController.saveResult]', error);
            res.status(400).json({ error: error.message || 'Save failed' });
        }
    },

    // Get Results
    async getResults(req: Request, res: Response) {
        try {
            const { session_id, term_id, class_id, subject_id, status } = req.query;
            if (!session_id || !term_id || !class_id || !subject_id) {
                return res.status(400).json({ error: 'Missing filter parameters' });
            }

            const data = await ResultService.getByContext({
                session_id: String(session_id),
                term_id: String(term_id),
                class_id: String(class_id),
                subject_id: String(subject_id),
                status: status ? String(status) : undefined
            });
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Teacher: Submit for approval
    async submit(req: any, res: Response) {
        try {
            const { session_id, term_id, class_id, subject_id, teacher_id } = req.body;
            if (!session_id || !term_id || !class_id || !subject_id) {
                return res.status(400).json({ error: 'Missing parameters' });
            }

            // PRODUCTION-CRITICAL: Extract teacher_id from authenticated user if not provided
            let teacherId = teacher_id;
            if (!teacherId) {
                const { data: teacher } = await supabase
                    .from('teachers')
                    .select('id')
                    .eq('auth_user_id', req.user.id)
                    .single();

                if (!teacher) {
                    return res.status(403).json({ error: 'Teacher profile not found' });
                }
                teacherId = teacher.id;
            }

            const result = await ResultService.submitResults(
                session_id,
                term_id,
                class_id,
                subject_id,
                teacherId  // REQUIRED for ownership validation
            );

            res.json({ message: 'Results submitted for approval', count: result?.length });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    // Admin: Approve results
    async approve(req: any, res: Response) {
        try {
            const { result_ids } = req.body;
            if (!result_ids || !Array.isArray(result_ids)) {
                return res.status(400).json({ error: 'Result IDs array required' });
            }

            // adminProfileId is required for audit
            const result = await ResultService.approveResults(result_ids, req.user.id);
            res.json({ message: 'Results approved', count: result?.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Admin: Reject results
    async reject(req: Request, res: Response) {
        try {
            const { result_ids } = req.body;
            if (!result_ids || !Array.isArray(result_ids)) {
                return res.status(400).json({ error: 'Result IDs array required' });
            }

            const result = await ResultService.rejectResults(result_ids);
            res.json({ message: 'Results rejected and returned to draft', count: result?.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Admin: Get Submitted Results for approval
    async getSubmitted(req: Request, res: Response) {
        try {
            const { session_id, term_id } = req.query;
            if (!session_id || !term_id) return res.status(400).json({ error: 'Context required' });

            const data = await ResultService.getSubmitted(String(session_id), String(term_id));
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getGradingScales(req: Request, res: Response) {
        try {
            const scales = await ResultService.getGradingScales();
            res.json(scales);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // PRODUCTION-CRITICAL: Get grouped submitted results for admin
    async getSubmittedGrouped(req: Request, res: Response) {
        try {
            const { session_id, term_id } = req.query;
            if (!session_id || !term_id) {
                return res.status(400).json({ error: 'Session and term required' });
            }

            const data = await ResultService.getSubmittedGrouped(
                String(session_id),
                String(term_id)
            );
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
