import { z } from 'zod';

export const createTeacherSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    staff_id: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
});

export const updateTeacherSchema = createTeacherSchema.partial().omit({ email: true });

export const assignTeacherSchema = z.object({
    class_id: z.string().uuid('Invalid class selection'),
    subject_id: z.string().uuid('Invalid subject selection'),
});
