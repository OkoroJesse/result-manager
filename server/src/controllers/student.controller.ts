import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { createStudentSchema, updateStudentSchema } from '../validators/people.schema';

export const StudentController = {
    async getAll(req: Request, res: Response) {
        try {
            const { class_id, status, search } = req.query;
            const students = await StudentService.getAll({
                class_id: class_id as string,
                status: status as string,
                search: search as string
            });
            res.json(students);
        } catch (error) {
            console.error('[StudentController.getAll]', error);
            res.status(500).json({ error: 'Failed to fetch students' });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const student = await StudentService.getById(id);
            if (!student) {
                res.status(404).json({ error: 'Student not found' });
                return;
            }
            res.json(student);
        } catch (error) {
            console.error('[StudentController.getById]', error);
            res.status(500).json({ error: 'Failed to fetch student details' });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const validated = createStudentSchema.parse(req.body);

            // Note: auth_user_id is NULL by default in this flow as per requirements
            const newStudent = await StudentService.create({
                first_name: validated.first_name,
                last_name: validated.last_name,
                admission_number: validated.admission_number,
                class_id: validated.class_id,
                gender: validated.gender,
                dob: validated.dob ? new Date(validated.dob) : null,
                status: validated.status || 'active'
            });

            res.status(201).json(newStudent);
        } catch (error: any) {
            console.error('[StudentController.create]', error);
            res.status(400).json({ error: error.message || 'Invalid student data' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validated = updateStudentSchema.parse(req.body);

            const updated = await StudentService.update(id, validated);
            res.json(updated);
        } catch (error: any) {
            console.error('[StudentController.update]', error);
            res.status(400).json({ error: error.message || 'Failed to update student' });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // Requirement: "Deactivate Student - Sets status = 'withdrawn' - Does NOT delete records"
            const deactivated = await StudentService.delete(id);
            res.json({ message: 'Student deactivated (withdrawn)', data: deactivated });
        } catch (error: any) {
            console.error('[StudentController.delete]', error);
            res.status(500).json({ error: 'Failed to deactivate student' });
        }
    }
};
