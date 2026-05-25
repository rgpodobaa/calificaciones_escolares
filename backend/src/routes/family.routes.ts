import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { getFamilyStudents } from '../controllers/student.controller';

const router = Router();

// Endpoint para obtener los hijos de la familia logueada
router.get('/students', verifyToken, requireRoles([Role.FAMILIA]), getFamilyStudents);

export default router;
