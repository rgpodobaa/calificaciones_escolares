import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role, GradePeriod } from '@prisma/client';

// 1. Obtener los alumnos asociados al usuario FAMILIA logueado
export const getFamilyStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== Role.FAMILIA) {
      res.status(403).json({ message: 'Acceso denegado. Solo accesible para familias.' });
      return;
    }

    const students = await prisma.student.findMany({
      where: { familyId: userId },
      include: {
        course: {
          include: {
            preceptor: { select: { id: true, name: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los alumnos de la familia.' });
  }
};

// 2. Generar el boletín digital consolidado del alumno
export const getStudentReportCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    // Buscar estudiante y verificar que exista
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { course: true }
    });

    if (!student) {
      res.status(404).json({ message: 'Estudiante no encontrado.' });
      return;
    }

    // ==========================================
    // VALIDACIÓN DE SEGURIDAD POR ROL
    // ==========================================
    if (userRole === Role.FAMILIA) {
      // Familias solo pueden ver a sus propios hijos
      if (student.familyId !== userId) {
        res.status(403).json({ message: 'No tienes acceso al boletín de este alumno.' });
        return;
      }
    } 
    else if (userRole === Role.PRECEPTOR) {
      // Preceptor solo del curso asignado
      if (!student.courseId || !student.course || student.course.preceptorId !== userId) {
        res.status(403).json({ message: 'No tienes acceso al boletín de este alumno.' });
        return;
      }
    } 
    else if (userRole === Role.DOCENTE) {
      // Docente debe enseñarle al menos una materia
      const matchingSubject = await prisma.subject.findFirst({
        where: {
          courseId: student.courseId || '',
          teacherId: userId
        }
      });
      if (!matchingSubject) {
        res.status(403).json({ message: 'No enseñas materias a este alumno.' });
        return;
      }
    }
    // Directivos y Secretarios tienen acceso libre, no requieren chequeos adicionales

    // ==========================================
    // RECOPILAR DATOS DEL BOLETÍN
    // ==========================================

    // 1. Obtener todas las materias del curso del estudiante
    const subjects = await prisma.subject.findMany({
      where: { courseId: student.courseId || '' },
      include: {
        teacher: { select: { id: true, name: true, lastName: true } }
      },
      orderBy: { name: 'asc' }
    });

    // 2. Obtener todas las calificaciones del alumno
    const grades = await prisma.grade.findMany({
      where: { studentId }
    });

    // 3. Obtener todas las asistencias del alumno
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'asc' }
    });

    // 4. Calcular el resumen de asistencias
    const attendanceSummary = {
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      justified: attendances.filter(a => a.status === 'JUSTIFIED').length,
      total: attendances.length
    };

    // 5. Estructurar las calificaciones por materia y período
    const subjectGrades = subjects.map(subject => {
      const subjectGradesList = grades.filter(g => g.subjectId === subject.id);
      
      const periods: Record<GradePeriod, any> = {
        PRE_INFORME_1: null,
        CUATRIMESTRE_1: null,
        PRE_INFORME_2: null,
        CUATRIMESTRE_2: null,
        FINAL: null
      };

      subjectGradesList.forEach(g => {
        periods[g.period] = {
          id: g.id,
          concept: g.concept,
          numericValue: g.numericValue,
          comments: g.comments,
          updatedAt: g.updatedAt
        };
      });

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        teacher: subject.teacher,
        grades: periods
      };
    });

    res.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        birthDate: student.birthDate
      },
      course: student.course ? {
        id: student.course.id,
        year: student.course.year,
        division: student.course.division,
        shift: student.course.shift
      } : null,
      subjects: subjectGrades,
      attendanceSummary,
      attendanceRecords: attendances.map(a => ({
        id: a.id,
        date: a.date.toISOString().split('T')[0],
        status: a.status,
        justification: a.justification
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el boletín del alumno.' });
  }
};
