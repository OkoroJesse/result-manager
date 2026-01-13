import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { createSessionSchema, updateSessionSchema } from '../validators/academic.schema';

export const SessionController = {
    async getAll(req: Request, res: Response) {
        try {
            const sessions = await SessionService.getAll();
            res.json(sessions);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    },

    async getActive(req: Request, res: Response) {
        try {
            const data = await SessionService.getActive();
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await createSessionSchema.parseAsync(req.body);
            const newItem = await SessionService.create(data);
            res.status(201).json(newItem);
        } catch (error: any) {
            if (error.issues) {
                res.status(400).json({ error: error.issues[0].message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await updateSessionSchema.parseAsync(req.body);
            const updatedItem = await SessionService.update(req.params.id, data);
            res.json(updatedItem);
        } catch (error: any) {
            if (error.issues) {
                res.status(400).json({ error: error.issues[0].message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    },

    async activate(req: Request, res: Response) {
        try {
            const updatedItem = await SessionService.activate(req.params.id);
            res.json(updatedItem);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await SessionService.delete(id);
            res.json({ message: 'Session deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Delete failed' });
        }
    }
};
