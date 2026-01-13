
import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(requireAuth);

// Admin Routes
router.post('/', requireRole(['admin']), TeacherController.create);
router.get('/', requireRole(['admin']), TeacherController.getAll);
router.post('/:teacherId/assign', requireRole(['admin']), TeacherController.assign);
router.delete('/assignments/:id', requireRole(['admin']), TeacherController.removeAssignment);

// Teacher Routes
router.get('/me', requireRole(['teacher', 'admin']), TeacherController.getMe);

export default router;
