import { z } from 'zod';

export const createClassSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.enum(['PRI', 'JSS', 'SSS']), // Category
    order: z.number().int().min(1, 'Order must be a positive integer'), // Sorting Order
    is_active: z.boolean().optional().default(true),
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().optional(),
    category: z.enum(['primary', 'secondary']),
    status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const assignSubjectSchema = z.object({
    subject_id: z.string().uuid('Invalid subject ID'),
    is_compulsory: z.boolean().optional().default(true),
});

// Sessions
const sessionObject = z.object({
    name: z.string().min(1, 'Name is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format'),
    is_active: z.boolean().optional().default(false),
});

export const createSessionSchema = sessionObject.refine(data => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"]
});

export const updateSessionSchema = sessionObject.partial();

// Terms
const termObject = z.object({
    name: z.string().min(1, 'Term name is required'),
    order: z.number().int().min(1, 'Order must be at least 1'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
    session_id: z.string().uuid('Session ID is required'),
    is_active: z.boolean().optional().default(false),
    status: z.enum(['draft', 'active', 'closed']).optional().default('draft'),
});

export const createTermSchema = termObject.refine(data => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"]
});

export const updateTermSchema = termObject.partial();
