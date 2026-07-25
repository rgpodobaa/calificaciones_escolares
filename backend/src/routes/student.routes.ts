import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { getStudentReportCard, getStudentMe } from '../controllers/student.controller';

const router = Router();

// Endpoint para que el alumno logueado obtenga su legajo
router.get(
  '/me',
  verifyToken,
  requireRoles([Role.ALUMNO]),
  getStudentMe
);

// Endpoint para el boletín consolidado con restricción de roles explícita
router.get(
  '/:studentId/boletin',
  verifyToken,
  requireRoles([Role.DIRECTIVO, Role.SECRETARIO, Role.PRECEPTOR, Role.DOCENTE, Role.ALUMNO]),
  getStudentReportCard
);

export default router;
