import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role, AttendanceStatus } from '@prisma/client';

// Helper to parse date string YYYY-MM-DD to UTC midnight Date object
const parseDateToUTC = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// 1. Obtener cursos asignados al preceptor (o todos si es Directivo/Secretario)
export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    let courses;

    // Si es Directivo o Secretario, ve todos los cursos
    if (userRole === Role.DIRECTIVO || userRole === Role.SECRETARIO) {
      courses = await prisma.course.findMany({
        include: {
          preceptor: {
            select: { id: true, name: true, lastName: true }
          }
        },
        orderBy: [{ year: 'asc' }, { division: 'asc' }]
      });
    } else {
      // Si es Preceptor, ve solo los propios
      courses = await prisma.course.findMany({
        where: { preceptorId: userId },
        include: {
          preceptor: {
            select: { id: true, name: true, lastName: true }
          }
        },
        orderBy: [{ year: 'asc' }, { division: 'asc' }]
      });
    }

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los cursos.' });
  }
};

// 2. Obtener alumnos de un curso asignado al preceptor
export const getCourseStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    // Verificar si el curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      res.status(404).json({ message: 'Curso no encontrado.' });
      return;
    }

    // Si es Preceptor, verificar que tenga asignado el curso
    if (userRole === Role.PRECEPTOR && course.preceptorId !== userId) {
      res.status(403).json({ message: 'No tienes acceso a este curso.' });
      return;
    }

    const students = await prisma.student.findMany({
      where: { courseId, active: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los alumnos del curso.' });
  }
};

// 3. Obtener asistencia de un curso en una fecha determinada (?date=YYYY-MM-DD)
export const getCourseAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const date = req.query.date as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({ message: 'Debe especificar una fecha válida (?date=YYYY-MM-DD).' });
      return;
    }

    // Verificar acceso al curso
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      res.status(404).json({ message: 'Curso no encontrado.' });
      return;
    }

    if (userRole === Role.PRECEPTOR && course.preceptorId !== userId) {
      res.status(403).json({ message: 'No tienes acceso a este curso.' });
      return;
    }

    const dateObj = parseDateToUTC(date);

    // Obtener los alumnos del curso
    const students = await prisma.student.findMany({
      where: { courseId, active: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    // Obtener las asistencias registradas para esa fecha y esos alumnos
    const attendances = await prisma.attendance.findMany({
      where: {
        date: dateObj,
        studentId: { in: students.map(s => s.id) }
      }
    });

    // Mapear los alumnos para devolver su estado (o nulo si no se tomó asistencia aún)
    const result = students.map(student => {
      const attendance = attendances.find(a => a.studentId === student.id);
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        attendance: attendance ? {
          id: attendance.id,
          status: attendance.status,
          justification: attendance.justification,
          createdAt: attendance.createdAt
        } : null
      };
    });

    res.json({
      date,
      courseId,
      records: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la asistencia del curso.' });
  }
};

// 4. Registrar o actualizar la asistencia diaria (upsert en lote)
export const upsertAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, records } = req.body; // records: [{ studentId, status, justification }]
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    if (!date || typeof date !== 'string' || !records || !Array.isArray(records)) {
      res.status(400).json({ message: 'Fecha y registros son obligatorios.' });
      return;
    }

    const dateObj = parseDateToUTC(date);

    // Realizar operaciones en una transacción Prisma para asegurar consistencia
    const results = await prisma.$transaction(
      records.map(record => {
        const { studentId, status, justification } = record;
        
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId,
              date: dateObj
            }
          },
          update: {
            status: status as AttendanceStatus,
            justification: justification || null
          },
          create: {
            studentId,
            date: dateObj,
            status: status as AttendanceStatus,
            justification: justification || null
          }
        });
      })
    );

    res.json({
      message: 'Asistencia registrada/actualizada exitosamente.',
      count: results.length,
      records: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar la asistencia.' });
  }
};
