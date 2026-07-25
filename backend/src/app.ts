import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import preceptorRoutes from './routes/preceptor.routes';
import teacherRoutes from './routes/teacher.routes';
import communicationRoutes from './routes/communication.routes';
import studentRoutes from './routes/student.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/preceptor', preceptorRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/students', studentRoutes);

export default app;
