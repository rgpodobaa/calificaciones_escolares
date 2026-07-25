import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

// 1. Crear un comunicado (Solo Directivo, Secretario y Preceptor)
export const createCommunication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetCourseId, targetStudentId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    if (!title || !content) {
      res.status(400).json({ message: 'El título y el contenido son obligatorios.' });
      return;
    }

    // Si es Preceptor, opcionalmente verificar que tenga asignado el curso si lo especifica
    if (userRole === Role.PRECEPTOR && targetCourseId) {
      const course = await prisma.course.findUnique({ where: { id: targetCourseId } });
      if (!course || course.preceptorId !== userId) {
        res.status(403).json({ message: 'No puedes enviar comunicados a un curso que no tienes asignado.' });
        return;
      }
    }

    const communication = await prisma.communication.create({
      data: {
        title,
        content,
        authorId: userId,
        targetCourseId: targetCourseId || null,
        targetStudentId: targetStudentId || null
      },
      include: {
        author: { select: { id: true, name: true, lastName: true, role: true } },
        targetCourse: true
      }
    });

    res.status(201).json({
      message: 'Comunicado creado exitosamente.',
      communication
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el comunicado.' });
  }
};

// 2. Obtener comunicados relevantes según el rol del usuario logueado
export const getCommunications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    let communications: any[] = [];

    if (userRole === Role.DIRECTIVO || userRole === Role.SECRETARIO) {
      // Directivo/Secretario: ven todos los comunicados
      communications = await prisma.communication.findMany({
        include: {
          author: { select: { id: true, name: true, lastName: true, role: true } },
          targetCourse: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } 
    else if (userRole === Role.PRECEPTOR) {
      // Preceptor: ve los creados por él, o dirigidos a sus cursos asignados, o comunicados generales
      const preceptedCourses = await prisma.course.findMany({
        where: { preceptorId: userId },
        select: { id: true }
      });
      const courseIds = preceptedCourses.map(c => c.id);

      communications = await prisma.communication.findMany({
        where: {
          OR: [
            { authorId: userId },
            { targetCourseId: { in: courseIds } },
            { AND: [{ targetCourseId: null }, { targetStudentId: null }] }
          ]
        },
        include: {
          author: { select: { id: true, name: true, lastName: true, role: true } },
          targetCourse: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } 
    else if (userRole === Role.DOCENTE) {
      // Docente: ve los creados por él, o dirigidos a cursos donde enseña, o generales
      const teachingSubjects = await prisma.subject.findMany({
        where: { teacherId: userId },
        select: { courseId: true }
      });
      const courseIds = Array.from(new Set(teachingSubjects.map(s => s.courseId)));

      communications = await prisma.communication.findMany({
        where: {
          OR: [
            { authorId: userId },
            { targetCourseId: { in: courseIds } },
            { AND: [{ targetCourseId: null }, { targetStudentId: null }] }
          ]
        },
        include: {
          author: { select: { id: true, name: true, lastName: true, role: true } },
          targetCourse: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } 
    else if (userRole === Role.ALUMNO) {
      // Alumno: ve comunicados generales, directos a su usuario, o dirigidos a su curso
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { id: true, courseId: true }
      });

      const studentCourseId = student?.courseId || null;
      const studentId = student?.id || null;

      communications = await prisma.communication.findMany({
        where: {
          OR: [
            { AND: [{ targetCourseId: null }, { targetStudentId: null }] },
            { targetStudentId: studentId },
            ...(studentCourseId ? [{ targetCourseId: studentCourseId }] : [])
          ]
        },
        include: {
          author: { select: { id: true, name: true, lastName: true, role: true } },
          targetCourse: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(communications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los comunicados.' });
  }
};
