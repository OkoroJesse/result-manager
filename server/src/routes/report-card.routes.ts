import { Router } from 'express';
import { ReportCardController } from '../controllers/report-card.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(requireAuth);

// Routes
// GET /api/report-cards/:student_id?session_id=...&term_id=...
router.get('/:student_id', requireRole(['admin', 'teacher', 'student']), ReportCardController.getStudentReport);

export default router;
