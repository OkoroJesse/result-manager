import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public route
router.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Protected route (Any authenticated user)
router.get('/me', requireAuth, (req: any, res) => {
    res.json({
        user: (req as any).user,
        role: (req as any).role
    });
});

// Admin only route
router.get('/admin', requireAuth, requireRole(['admin']), (req, res) => {
    res.json({ message: 'Welcome Admin' });
});

// Teacher or Admin
router.get('/staff', requireAuth, requireRole(['admin', 'teacher']), (req, res) => {
    res.json({ message: 'Welcome Staff' });
});

export default router;
