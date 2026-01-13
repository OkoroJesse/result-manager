import { Request, Response } from 'express';
import { TermService } from '../services/term.service';
import { createTermSchema, updateTermSchema } from '../validators/academic.schema';

export const TermController = {
    async getAll(req: Request, res: Response) {
        try {
            const { sessionId } = req.query;
            const terms = await TermService.getAll(sessionId as string);
            res.json(terms);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch terms' });
        }
    },

    async getActive(req: Request, res: Response) {
        try {
            const { sessionId } = req.query;
            const data = await TermService.getActive(sessionId as string);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await createTermSchema.parseAsync(req.body);
            const newItem = await TermService.create(data);
            res.status(201).json(newItem);
        } catch (error: any) {
            if (error.issues) {
                res.status(400).json({ error: error.issues[0].message });
            } else if (error.code === '23505') { // Keep specific DB error for unique constraint
                res.status(409).json({ error: 'Term name already exists' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await updateTermSchema.parseAsync(req.body);
            const updatedItem = await TermService.update(req.params.id, data);
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
            const updatedItem = await TermService.activate(req.params.id);
            res.json(updatedItem);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await TermService.delete(id);
            res.json({ message: 'Term deleted' });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Delete failed' });
        }
    },

    async close(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await TermService.close(id);
            res.json({ message: 'Term closed and results locked' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
