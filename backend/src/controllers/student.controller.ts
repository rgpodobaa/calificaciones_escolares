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

    // 1. Obtener todas las calificaciones del alumno con materias y cursos
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: {
          include: {
            course: true,
            teacher: { select: { id: true, name: true, lastName: true } }
          }
        }
      }
    });

    // 2. Obtener todas las asistencias del alumno
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'asc' }
    });

    // 3. Calcular el resumen de asistencias
    const attendanceSummary = {
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.status === 'LATE').length,
      justified: attendances.filter(a => a.status === 'JUSTIFIED').length,
      total: attendances.length
    };

    // 4. Agrupar las materias e inasistencias por ciclo lectivo y curso
    const academicHistory: Record<string, any> = {};

    // Procesar las calificaciones que ya existen
    grades.forEach(g => {
      const year = g.schoolYear;
      const courseId = g.subject.courseId;
      const groupKey = `${year}_${courseId}`;

      if (!academicHistory[groupKey]) {
        academicHistory[groupKey] = {
          schoolYear: year,
          course: g.subject.course ? {
            id: g.subject.course.id,
            year: g.subject.course.year,
            division: g.subject.course.division,
            shift: g.subject.course.shift
          } : null,
          subjects: []
        };
      }

      // Buscar si la materia ya está añadida en ese grupo
      let subEntry = academicHistory[groupKey].subjects.find((s: any) => s.subjectId === g.subjectId);
      if (!subEntry) {
        subEntry = {
          subjectId: g.subjectId,
          subjectName: g.subject.name,
          teacher: g.subject.teacher,
          grades: {
            PRE_INFORME_1: null,
            CUATRIMESTRE_1: null,
            PRE_INFORME_2: null,
            CUATRIMESTRE_2: null,
            FINAL: null
          }
        };
        academicHistory[groupKey].subjects.push(subEntry);
      }

      // Asignar la nota
      subEntry.grades[g.period] = {
        id: g.id,
        concept: g.concept,
        numericValue: g.numericValue,
        comments: g.comments,
        updatedAt: g.updatedAt
      };
    });

    // 5. Asegurar que el curso actual esté presente
    if (student.courseId) {
      const currentYear = new Date().getFullYear();
      const currentGroupKey = `${currentYear}_${student.courseId}`;

      if (!academicHistory[currentGroupKey]) {
        const currentSubjects = await prisma.subject.findMany({
          where: { courseId: student.courseId },
          include: {
            teacher: { select: { id: true, name: true, lastName: true } }
          },
          orderBy: { name: 'asc' }
        });

        academicHistory[currentGroupKey] = {
          schoolYear: currentYear,
          course: student.course ? {
            id: student.course.id,
            year: student.course.year,
            division: student.course.division,
            shift: student.course.shift
          } : null,
          subjects: currentSubjects.map(sub => ({
            subjectId: sub.id,
            subjectName: sub.name,
            teacher: sub.teacher,
            grades: {
              PRE_INFORME_1: null,
              CUATRIMESTRE_1: null,
              PRE_INFORME_2: null,
              CUATRIMESTRE_2: null,
              FINAL: null
            }
          }))
        };
      }
    }

    res.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        birthDate: student.birthDate
      },
      currentCourse: student.course ? {
        id: student.course.id,
        year: student.course.year,
        division: student.course.division,
        shift: student.course.shift
      } : null,
      academicHistory,
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
