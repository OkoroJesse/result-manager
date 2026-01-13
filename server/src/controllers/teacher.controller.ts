import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { createTeacherSchema, updateTeacherSchema, assignTeacherSchema } from '../validators/teacher.schema';

export const TeacherController = {
    async getAll(req: Request, res: Response) {
        try {
            const { status, search } = req.query;
            const teachers = await TeacherService.getAll({
                status: status as string,
                search: search as string
            });
            res.json(teachers);
        } catch (error) {
            console.error('[TeacherController.getAll]', error);
            res.status(500).json({ error: 'Failed to fetch teachers' });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const teacher = await TeacherService.getById(id);
            if (!teacher) {
                res.status(404).json({ error: 'Teacher not found' });
                return;
            }
            res.json(teacher);
        } catch (error) {
            console.error('[TeacherController.getById]', error);
            res.status(500).json({ error: 'Failed to fetch teacher details' });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const validated = createTeacherSchema.parse(req.body);
            const teacher = await TeacherService.create(validated);
            res.status(201).json(teacher);
        } catch (error: any) {
            console.error('[TeacherController.create]', error);
            res.status(400).json({ error: error.message || 'Invalid teacher data' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validated = updateTeacherSchema.parse(req.body);
            const updated = await TeacherService.update(id, validated);
            res.json(updated);
        } catch (error: any) {
            console.error('[TeacherController.update]', error);
            res.status(400).json({ error: error.message || 'Update failed' });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await TeacherService.delete(id);
            res.json({ message: 'Teacher deactivated' });
        } catch (error: any) {
            console.error('[TeacherController.delete]', error);
            res.status(500).json({ error: 'Deactivation failed' });
        }
    },

    // Assignments
    async assign(req: Request, res: Response) {
        try {
            const { teacherId } = req.params;
            const validated = assignTeacherSchema.parse(req.body);

            const assignment = await TeacherService.assign(teacherId, validated.class_id, validated.subject_id);
            res.status(201).json(assignment);
        } catch (error: any) {
            console.error('[TeacherController.assign]', error);
            res.status(400).json({ error: error.message || 'Assignment failed' });
        }
    },

    async getAssignments(req: Request, res: Response) {
        try {
            const { id: teacherId } = req.params;
            const assignments = await TeacherService.getAssignments(teacherId);
            res.json(assignments);
        } catch (error) {
            console.error('[TeacherController.getAssignments]', error);
            res.status(500).json({ error: 'Failed to fetch assignments' });
        }
    },

    async removeAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params; // Changed from assignmentId to id to match standard
            await TeacherService.removeAssignment(id);
            res.json({ message: 'Assignment removed' });
        } catch (error) {
            console.error('[TeacherController.removeAssignment]', error);
            res.status(500).json({ error: 'Failed to remove assignment' });
        }
    },

    async getMe(req: Request, res: Response) {
        try {
            const authUserId = (req as any).user?.id;
            if (!authUserId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const teacher = await TeacherService.getByAuthId(authUserId);

            if (!teacher) {
                // If the user is an admin, they might not have a teacher profile. 
                // We should return a basic profile instead of a 404 to keep the UI happy.
                const role = (req as any).role;
                if (role === 'admin') {
                    res.json({
                        id: 'admin-virtual-id',
                        first_name: (req as any).user?.user_metadata?.first_name || 'System',
                        last_name: (req as any).user?.user_metadata?.last_name || 'Admin',
                        email: (req as any).user?.email,
                        status: 'active',
                        is_admin: true
                    });
                    return;
                }

                res.status(404).json({ error: 'Teacher profile not found' });
                return;
            }
            res.json(teacher);
        } catch (error: any) {
            console.error('[TeacherController.getMe]', error);
            res.status(500).json({ error: error.message });
        }
    }
};
