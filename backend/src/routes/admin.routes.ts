import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  createUser, getUsers, updateUser, deleteUser,
  createCourse, getCourses, updateCourse, deleteCourse,
  createSubject, getSubjects, updateSubject, deleteSubject,
  createStudent, getStudents, updateStudent, deleteStudent
} from '../controllers/admin.controller';

const router = Router();

// Middleware global para asegurar autenticación y rol administrativo
router.use(verifyToken);
router.use(requireRoles([Role.DIRECTIVO, Role.SECRETARIO]));

// ABM Usuarios
router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// ABM Cursos
router.post('/courses', createCourse);
router.get('/courses', getCourses);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// ABM Materias
router.post('/subjects', createSubject);
router.get('/subjects', getSubjects);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// ABM Alumnos
router.post('/students', createStudent);
router.get('/students', getStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

export default router;
