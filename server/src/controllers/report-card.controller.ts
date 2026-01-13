import { Request, Response } from 'express';
import { ReportCardService } from '../services/report-card.service';
import { supabase } from '../config/supabase';

export const ReportCardController = {
    async getStudentReport(req: Request, res: Response) {
        try {
            const { student_id } = req.params;
            const { session_id, term_id } = req.query;
            const user = (req as any).user;

            if (!session_id || !term_id) {
                return res.status(400).json({ error: 'Session and Term are required' });
            }

            // 1. Authorization Check
            if (user.role === 'student') {
                const { data: student } = await supabase.from('students').select('id').eq('auth_user_id', user.id).single();
                if (!student || student.id !== student_id) {
                    return res.status(403).json({ error: 'Unauthorized to view this report' });
                }
            }

            // 2. Delegate to Service
            const report = await ReportCardService.getStudentReport(
                student_id,
                session_id as string,
                term_id as string
            );

            res.json(report);

        } catch (error: any) {
            console.error('Report Card Error:', error);
            const status = error.message.includes('not found') ? 404 :
                error.message.includes('No approved results') ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    }
};
