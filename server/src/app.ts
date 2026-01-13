import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

import authRoutes from './routes/auth.routes';
import academicRoutes from './routes/academic.routes';
import peopleRoutes from './routes/people.routes';
import resultRoutes from './routes/result.routes';
import reportCardRoutes from './routes/report-card.routes';
import teacherRoutes from './routes/teacher.routes';
import statsRoutes from './routes/stats.routes';

app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/stats', statsRoutes);

export default app;
