import { Request, Response } from 'express';
import { PromotionService } from '../services/promotion.service';

export const PromotionController = {
    async promoteBatch(req: Request, res: Response) {
        try {
            const { sessionFromId, sessionToId, classFromId, classToId, status } = req.body;
            const adminId = (req as any).user?.id;

            if (!sessionFromId || !sessionToId || !classFromId || !classToId) {
                return res.status(400).json({ error: 'Missing required promotion parameters' });
            }

            const result = await PromotionService.promoteBatch({
                sessionFromId,
                sessionToId,
                classFromId,
                classToId,
                adminId,
                status
            });

            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getHistory(req: Request, res: Response) {
        try {
            const history = await PromotionService.getPromotionHistory();
            res.json(history);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getStudentHistory(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const history = await PromotionService.getStudentHistory(studentId);
            res.json(history);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
