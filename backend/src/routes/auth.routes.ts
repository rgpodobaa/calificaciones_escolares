import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);

// Ruta de prueba para verificar que el token funciona
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: (req as any).user });
});

export default router;
