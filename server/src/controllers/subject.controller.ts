import { Request, Response } from 'express';
import { SubjectService } from '../services/subject.service';
import { createSubjectSchema, updateSubjectSchema, assignSubjectSchema } from '../validators/academic.schema';

export const SubjectController = {
    async getAll(req: Request, res: Response) {
        try {
            const subjects = await SubjectService.getAll();
            res.json(subjects);
        } catch (error) {
            console.error('[SubjectController.getAll]', error);
            res.status(500).json({ error: 'Failed to fetch subjects' });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const validated = createSubjectSchema.parse(req.body);
            const newSubject = await SubjectService.create(validated);
            res.status(201).json(newSubject);
        } catch (error: any) {
            if (error.code === '23505') {
                res.status(409).json({ error: 'Subject name or code already exists' });
                return;
            }
            res.status(400).json({ error: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validated = updateSubjectSchema.parse(req.body);
            const updated = await SubjectService.update(id, validated);
            res.json(updated);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await SubjectService.delete(id);
            res.json({ message: 'Subject deactivated' });
        } catch (error) {
            console.error('[SubjectController.delete]', error);
            res.status(500).json({ error: 'Failed to deactivate subject' });
        }
    },

    // Junction Endpoints
    async getByClass(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const subjects = await SubjectService.getByClass(id);
            res.json(subjects);
        } catch (error) {
            console.error('[SubjectController.getByClass]', error);
            res.status(500).json({ error: 'Failed to fetch class subjects' });
        }
    },

    async assignToClass(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const validated = assignSubjectSchema.parse(req.body);
            const assignment = await SubjectService.assignToClass(classId, validated);
            res.status(201).json(assignment);
        } catch (error: any) {
            console.error('[SubjectController.assignToClass]', error);

            // Handle duplicate assignment
            if (error.message?.includes('already assigned')) {
                res.status(409).json({ error: error.message });
                return;
            }

            res.status(400).json({ error: error.message || 'Assignment failed' });
        }
    },

    async removeFromClass(req: Request, res: Response) {
        try {
            const { assignmentId } = req.params;
            await SubjectService.removeFromClass(assignmentId);
            res.json({ message: 'Subject removed from class' });
        } catch (error) {
            console.error('[SubjectController.removeFromClass]', error);
            res.status(500).json({ error: 'Removal failed' });
        }
    },

    async updateAssignment(req: Request, res: Response) {
        try {
            const { assignmentId } = req.params;
            const { is_compulsory } = req.body;
            const updated = await SubjectService.updateAssignment(assignmentId, { is_compulsory });
            res.json(updated);
        } catch (error) {
            console.error('[SubjectController.updateAssignment]', error);
            res.status(400).json({ error: 'Update failed' });
        }
    }
};
