import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { TeacherController } from '../controllers/teacher.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(requireAuth);

// Students
router.get('/students', requireRole(['admin', 'teacher']), StudentController.getAll);
router.post('/students', requireRole(['admin']), StudentController.create);
router.put('/students/:id', requireRole(['admin']), StudentController.update);
router.delete('/students/:id', requireRole(['admin']), StudentController.delete);

// Teachers: Handled in teacher.routes.ts now for specialized flow
// router.get('/teachers', ...);
// router.post('/teachers', ...);

export default router;
