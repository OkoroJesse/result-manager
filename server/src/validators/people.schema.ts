import { z } from 'zod';

export const createStudentSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    admission_number: z.string().min(1, 'Admission number is required'),
    class_id: z.string().uuid(),
    gender: z.enum(['male', 'female']).optional(),
    dob: z.string().optional(),
    status: z.enum(['active', 'graduated', 'withdrawn']).default('active'),
});

export const updateStudentSchema = createStudentSchema.partial().omit({ admission_number: true });

export const createTeacherSchema = z.object({
    email: z.string().email(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female']).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial().omit({ email: true });
