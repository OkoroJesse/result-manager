import { Request, Response } from 'express';
import { ClassService } from '../services/class.service';
import { createClassSchema, updateClassSchema } from '../validators/academic.schema';

export const ClassController = {
    async getAll(req: Request, res: Response) {
        try {
            const classes = await ClassService.getAll();
            res.json(classes);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch classes' });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const validated = createClassSchema.parse(req.body);
            const newClass = await ClassService.create(validated);
            res.status(201).json(newClass);
        } catch (error: any) {
            if (error.code === '23505') { // Postgres Unique Violation
                res.status(409).json({ error: 'Class name already exists' });
                return;
            }
            res.status(400).json({ error: error.message || 'Invalid input' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validated = updateClassSchema.parse(req.body);
            const updated = await ClassService.update(id, validated);
            res.json(updated);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Update failed' });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            await ClassService.delete(req.params.id);
            res.json({ message: 'Class deleted' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
