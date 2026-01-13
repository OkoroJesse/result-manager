
import { z } from 'zod';

export const createResultSchema = z.object({
    student_id: z.string().uuid(),
    class_id: z.string().uuid(),
    subject_id: z.string().uuid(),
    session_id: z.string().uuid(),
    term_id: z.string().uuid(),

    // Scores
    score_ca: z.number().min(0).max(40).optional().default(0),
    score_test: z.number().min(0).max(20).optional().default(0),
    score_exam: z.number().min(0).max(40).optional().default(0),

    status: z.enum(['draft']).optional().default('draft'), // Teachers can only create drafts
});

export const updateResultSchema = z.object({
    score_ca: z.number().min(0).max(40).optional(),
    score_test: z.number().min(0).max(20).optional(),
    score_exam: z.number().min(0).max(40).optional(),
    status: z.enum(['draft']).optional(), // Teachers can only stay in draft
});

export const publishResultSchema = z.object({
    session_id: z.string().uuid(),
    term_id: z.string().uuid(),
    class_id: z.string().uuid().optional(), // Optional: publish specific class
});
