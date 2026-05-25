import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  createCommunication,
  getCommunications
} from '../controllers/communication.controller';

const router = Router();

// Todos los usuarios autenticados pueden ver comunicados (el controlador filtra)
router.get('/', verifyToken, getCommunications);

// Solo Directivos, Secretarios y Preceptores pueden emitir comunicados
router.post('/', verifyToken, requireRoles([Role.DIRECTIVO, Role.SECRETARIO, Role.PRECEPTOR]), createCommunication);

export default router;
