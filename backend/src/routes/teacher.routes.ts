import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  getTeacherSubjects,
  getSubjectStudents,
  upsertGrade
} from '../controllers/teacher.controller';

const router = Router();

// Asegurar autenticación y roles de docente o administrativo
router.use(verifyToken);
router.use(requireRoles([Role.DOCENTE, Role.DIRECTIVO, Role.SECRETARIO]));

router.get('/subjects', getTeacherSubjects);
router.get('/subjects/:subjectId/students', getSubjectStudents);
router.post('/grades', upsertGrade);

export default router;
