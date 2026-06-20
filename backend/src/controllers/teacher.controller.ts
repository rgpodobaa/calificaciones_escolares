import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role, GradePeriod, ConceptGrade } from '@prisma/client';

// 1. Obtener materias asociadas al docente (o todas si es Directivo/Secretario)
export const getTeacherSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    let subjects;

    if (userRole === Role.DIRECTIVO || userRole === Role.SECRETARIO) {
      subjects = await prisma.subject.findMany({
        include: {
          course: true,
          teacher: {
            select: { id: true, name: true, lastName: true }
          }
        },
        orderBy: [{ course: { year: 'asc' } }, { course: { division: 'asc' } }, { name: 'asc' }]
      });
    } else {
      // Docente
      subjects = await prisma.subject.findMany({
        where: { teacherId: userId },
        include: {
          course: true,
          teacher: {
            select: { id: true, name: true, lastName: true }
          }
        },
        orderBy: [{ course: { year: 'asc' } }, { course: { division: 'asc' } }, { name: 'asc' }]
      });
    }

    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las materias.' });
  }
};

// 2. Obtener alumnos de una materia y sus notas cargadas en ella
export const getSubjectStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjectId = req.params.subjectId as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    // Buscar materia y verificar que exista
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { course: true }
    });

    if (!subject) {
      res.status(404).json({ message: 'Materia no encontrada.' });
      return;
    }

    // Si es Docente, verificar asignación
    if (userRole === Role.DOCENTE && subject.teacherId !== userId) {
      res.status(403).json({ message: 'No estás asignado como profesor de esta materia.' });
      return;
    }

    // Obtener los alumnos del curso de esta materia
    const students = await prisma.student.findMany({
      where: { courseId: subject.courseId, active: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    // Obtener las notas cargadas en esta materia para estos alumnos
    const grades = await prisma.grade.findMany({
      where: {
        subjectId,
        studentId: { in: students.map(s => s.id) }
      }
    });

    // Mapear cada alumno con su estructura de notas por período
    const result = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      
      const periods: Record<GradePeriod, any> = {
        PRE_INFORME_1: null,
        CUATRIMESTRE_1: null,
        PRE_INFORME_2: null,
        CUATRIMESTRE_2: null,
        FINAL: null
      };

      studentGrades.forEach(g => {
        periods[g.period] = {
          id: g.id,
          concept: g.concept,
          numericValue: g.numericValue,
          comments: g.comments,
          updatedAt: g.updatedAt
        };
      });

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        grades: periods
      };
    });

    res.json({
      subjectId,
      subjectName: subject.name,
      course: subject.course,
      students: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las calificaciones de los alumnos.' });
  }
};

// 3. Registrar o actualizar calificación de un alumno (upsert con validación)
export const upsertGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, subjectId, period, comments } = req.body;
    let { concept, numericValue, schoolYear } = req.body;

    if (schoolYear !== undefined && schoolYear !== null) {
      schoolYear = Number(schoolYear);
    } else {
      schoolYear = new Date().getFullYear();
    }
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    if (!studentId || !subjectId || !period) {
      res.status(400).json({ message: 'studentId, subjectId y period son obligatorios.' });
      return;
    }

    // Verificar periodo válido
    if (!Object.values(GradePeriod).includes(period as GradePeriod)) {
      res.status(400).json({ message: 'Periodo de calificación inválido.' });
      return;
    }

    // Buscar materia y verificar permisos
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      res.status(404).json({ message: 'Materia no encontrada.' });
      return;
    }

    if (userRole === Role.DOCENTE && subject.teacherId !== userId) {
      res.status(403).json({ message: 'No tienes permisos para calificar en esta materia.' });
      return;
    }

    // Verificar que el estudiante exista y pertenezca al curso
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      res.status(404).json({ message: 'Estudiante no encontrado.' });
      return;
    }

    if (student.courseId !== subject.courseId) {
      res.status(400).json({ message: 'El estudiante no pertenece al curso de esta materia.' });
      return;
    }

    // ==========================================
    // VALIDACIONES DE NEGOCIO (ARGENTINA)
    // ==========================================
    
    // Convertir numericValue a número si viene como string
    if (numericValue !== undefined && numericValue !== null) {
      numericValue = Number(numericValue);
      if (isNaN(numericValue)) {
        res.status(400).json({ message: 'La nota numérica debe ser un valor válido.' });
        return;
      }
    }

    if (period === GradePeriod.PRE_INFORME_1 || period === GradePeriod.PRE_INFORME_2) {
      // Pre-informe: calif. conceptual únicamente (TEA, TEP, TED)
      if (!concept) {
        res.status(400).json({ message: 'Los pre-informes requieren una nota conceptual (TEA, TEP o TED).' });
        return;
      }
      if (!Object.values(ConceptGrade).includes(concept as ConceptGrade)) {
        res.status(400).json({ message: 'Concepto de calificación inválido. Debe ser TEA, TEP o TED.' });
        return;
      }
      numericValue = null; // No numérico
    } 
    else if (period === GradePeriod.CUATRIMESTRE_1 || period === GradePeriod.CUATRIMESTRE_2) {
      // Cuatrimestre: valórico y numérico (1-10) al mismo tiempo
      if (numericValue === undefined || numericValue === null) {
        res.status(400).json({ message: 'Las notas cuatrimestrales requieren un valor numérico.' });
        return;
      }
      if (numericValue < 1 || numericValue > 10) {
        res.status(400).json({ message: 'La nota numérica debe estar entre 1 y 10.' });
        return;
      }

      // Validar u obtener correspondencia conceptual
      // TEA: 7-10, TEP: 4-6, TED: 1-4
      let expectedConcept: ConceptGrade;
      if (numericValue >= 7) {
        expectedConcept = ConceptGrade.TEA;
      } else if (numericValue >= 4) {
        expectedConcept = ConceptGrade.TEP;
      } else {
        expectedConcept = ConceptGrade.TED;
      }

      // Si el docente pasa un concepto, validamos que coincida. Si no, lo auto-asignamos.
      if (concept && concept !== expectedConcept) {
        res.status(400).json({
          message: `Inconsistencia: La nota numérica ${numericValue} corresponde al concepto ${expectedConcept}, pero enviaste ${concept}.`
        });
        return;
      }
      concept = expectedConcept;
    } 
    else if (period === GradePeriod.FINAL) {
      // Nota Final: numérica (1 a 10). Concepto nulo.
      if (numericValue !== undefined && numericValue !== null) {
        if (numericValue < 1 || numericValue > 10) {
          res.status(400).json({ message: 'La nota final debe estar entre 1 y 10.' });
          return;
        }
      }
      concept = null; // Sin concepto
    }

    // Upsert de la calificación
    const grade = await prisma.grade.upsert({
      where: {
        studentId_subjectId_period_schoolYear: {
          studentId,
          subjectId,
          period: period as GradePeriod,
          schoolYear
        }
      },
      update: {
        concept: concept as ConceptGrade | null,
        numericValue,
        comments: comments || null,
        teacherId: userId // Registrar quién actualizó
      },
      create: {
        studentId,
        subjectId,
        period: period as GradePeriod,
        concept: concept as ConceptGrade | null,
        numericValue,
        comments: comments || null,
        teacherId: userId,
        schoolYear
      }
    });

    res.json({
      message: 'Calificación registrada exitosamente.',
      grade
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar la calificación.' });
  }
};
