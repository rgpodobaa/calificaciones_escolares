import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  getCourses,
  getCourseStudents,
  getCourseAttendance,
  upsertAttendance
} from '../controllers/preceptor.controller';

const router = Router();

// Asegurar autenticación y roles de preceptor o administrativo
router.use(verifyToken);
router.use(requireRoles([Role.PRECEPTOR, Role.DIRECTIVO, Role.SECRETARIO]));

router.get('/courses', getCourses);
router.get('/courses/:courseId/students', getCourseStudents);
router.get('/courses/:courseId/attendance', getCourseAttendance);
router.post('/attendance', upsertAttendance);

export default router;
