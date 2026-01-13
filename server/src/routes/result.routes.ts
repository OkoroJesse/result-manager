import { Router } from 'express';
import { ResultController } from '../controllers/result.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(requireAuth);

// Teachers
router.get('/', requireRole(['teacher', 'admin']), ResultController.getResults);
router.post('/', requireRole(['teacher', 'admin']), ResultController.saveResult);
router.post('/submit', requireRole(['teacher', 'admin']), ResultController.submit);

// Admin Workflow
router.get('/submitted', requireRole(['admin']), ResultController.getSubmitted);
router.get('/submitted/grouped', requireRole(['admin']), ResultController.getSubmittedGrouped);
router.post('/approve', requireRole(['admin']), ResultController.approve);
router.post('/reject', requireRole(['admin']), ResultController.reject);
router.get('/grading-scales', requireRole(['teacher', 'admin']), ResultController.getGradingScales);

export default router;
