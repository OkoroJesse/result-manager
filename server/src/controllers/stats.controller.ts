import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';

export const StatsController = {
    async getDashboardStats(req: Request, res: Response) {
        try {
            const stats = await StatsService.getDashboardStats();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch stats' });
        }
    }
};
