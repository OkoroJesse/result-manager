import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { SubjectController } from '../controllers/subject.controller';
import { SessionController } from '../controllers/session.controller';
import { TermController } from '../controllers/term.controller';
import { PromotionController } from '../controllers/promotion.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Apply global protection for academic setup
router.use(requireAuth);
// router.use(requireRole(['admin'])); // Strictly Admin only

// Classes
router.get('/classes', ClassController.getAll);
router.post('/classes', requireRole(['admin']), ClassController.create);
router.put('/classes/:id', requireRole(['admin']), ClassController.update);
router.delete('/classes/:id', requireRole(['admin']), ClassController.delete);
router.get('/classes/:id/subjects', SubjectController.getByClass);
router.post('/classes/:id/subjects', requireRole(['admin']), SubjectController.assignToClass);
router.patch('/class-subjects/:assignmentId', requireRole(['admin']), SubjectController.updateAssignment);
router.delete('/class-subjects/:assignmentId', requireRole(['admin']), SubjectController.removeFromClass);

// Subjects
router.get('/subjects', SubjectController.getAll);
router.post('/subjects', requireRole(['admin']), SubjectController.create);
router.put('/subjects/:id', requireRole(['admin']), SubjectController.update);
router.delete('/subjects/:id', requireRole(['admin']), SubjectController.delete);

// Sessions
router.get('/sessions', SessionController.getAll);
router.get('/sessions/active', SessionController.getActive); // New public endpoint
router.post('/sessions', requireRole(['admin']), SessionController.create);
router.put('/sessions/:id', requireRole(['admin']), SessionController.update);
router.patch('/sessions/:id/activate', requireRole(['admin']), SessionController.activate); // New
router.delete('/sessions/:id', requireRole(['admin']), SessionController.delete);

// Terms
router.get('/terms', TermController.getAll);
router.get('/terms/active', TermController.getActive); // New public endpoint
router.post('/terms', requireRole(['admin']), TermController.create);
router.put('/terms/:id', requireRole(['admin']), TermController.update);
router.patch('/terms/:id/activate', requireRole(['admin']), TermController.activate);
router.patch('/terms/:id/close', requireRole(['admin']), TermController.close);
router.delete('/terms/:id', requireRole(['admin']), TermController.delete);

// Promotions
router.get('/promotions/history', requireRole(['admin']), PromotionController.getHistory);
router.post('/promotions/batch', requireRole(['admin']), PromotionController.promoteBatch);
router.get('/students/:studentId/history', requireAuth, PromotionController.getStudentHistory);

export default router;
