import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { getStudentReportCard } from '../controllers/student.controller';

const router = Router();

// Endpoint para el boletín consolidado
router.get('/:studentId/boletin', verifyToken, getStudentReportCard);

export default router;
