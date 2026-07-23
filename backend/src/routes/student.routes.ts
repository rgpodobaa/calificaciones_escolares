import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { getStudentReportCard } from '../controllers/student.controller';

const router = Router();

// Endpoint para el boletín consolidado con restricción de roles explícita
router.get(
  '/:studentId/boletin',
  verifyToken,
  requireRoles([Role.DIRECTIVO, Role.SECRETARIO, Role.PRECEPTOR, Role.DOCENTE, Role.FAMILIA]),
  getStudentReportCard
);

export default router;
