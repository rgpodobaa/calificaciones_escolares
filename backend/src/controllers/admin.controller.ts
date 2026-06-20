import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

// ==========================================
// ABM USUARIOS
// ==========================================

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, name, lastName, dni } = req.body;

    if (!email || !password || !role || !name || !lastName || !dni) {
      res.status(400).json({ message: 'Todos los campos son obligatorios.' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { dni }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ message: 'El email o DNI ya están registrados.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as Role,
        name,
        lastName,
        dni
      }
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        lastName: user.lastName,
        dni: user.dni
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el usuario.' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, includeInactive } = req.query;
    const whereClause: any = role ? { role: role as Role } : {};

    if (includeInactive !== 'true') {
      whereClause.active = true;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        lastName: true,
        dni: true,
        active: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los usuarios.' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email, password, role, name, lastName, dni, active } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }

    const data: any = {
      email,
      role: role as Role,
      name,
      lastName,
      dni
    };

    if (active !== undefined) {
      data.active = active;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    });

    res.json({
      message: 'Usuario actualizado exitosamente.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        dni: updatedUser.dni
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el usuario.' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado.' });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { active: false }
    });

    res.json({ message: 'Usuario inactivado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al inactivar el usuario.' });
  }
};

// ==========================================
// ABM CURSOS
// ==========================================

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        preceptor: {
          select: {
            id: true,
            name: true,
            lastName: true
          }
        }
      }
    });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los cursos.' });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, division, shift, preceptorId } = req.body;

    if (!year || !division || !shift) {
      res.status(400).json({ message: 'Año, división y turno son obligatorios.' });
      return;
    }

    const existingCourse = await prisma.course.findUnique({
      where: {
        year_division_shift: {
          year: Number(year),
          division,
          shift
        }
      }
    });

    if (existingCourse) {
      res.status(400).json({ message: 'Este curso ya existe.' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        year: Number(year),
        division,
        shift,
        preceptorId: preceptorId || null
      }
    });

    res.status(201).json({ message: 'Curso creado exitosamente.', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el curso.' });
  }
};

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { year, division, shift, preceptorId } = req.body;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ message: 'Curso no encontrado.' });
      return;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        year: year ? Number(year) : undefined,
        division,
        shift,
        preceptorId: preceptorId !== undefined ? preceptorId : undefined
      }
    });

    res.json({ message: 'Curso actualizado exitosamente.', course: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el curso.' });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ message: 'Curso no encontrado.' });
      return;
    }

    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Curso eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el curso.' });
  }
};

// ==========================================
// ABM MATERIAS
// ==========================================

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        course: true,
        teacher: {
          select: {
            id: true,
            name: true,
            lastName: true
          }
        }
      }
    });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las materias.' });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, courseId, teacherId } = req.body;

    if (!name || !courseId) {
      res.status(400).json({ message: 'Nombre y curso son obligatorios.' });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        courseId,
        teacherId: teacherId || null
      }
    });

    res.status(201).json({ message: 'Materia creada exitosamente.', subject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la materia.' });
  }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, courseId, teacherId } = req.body;

    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      res.status(404).json({ message: 'Materia no encontrada.' });
      return;
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name,
        courseId,
        teacherId: teacherId !== undefined ? teacherId : undefined
      }
    });

    res.json({ message: 'Materia actualizada exitosamente.', subject: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la materia.' });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      res.status(404).json({ message: 'Materia no encontrada.' });
      return;
    }

    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Materia eliminada exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la materia.' });
  }
};

// ==========================================
// ABM ALUMNOS
// ==========================================

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    const whereClause: any = {};

    if (includeInactive !== 'true') {
      whereClause.active = true;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        course: true,
        family: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los alumnos.' });
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dni, birthDate, courseId, familyId } = req.body;

    if (!firstName || !lastName || !dni) {
      res.status(400).json({ message: 'Nombre, apellido y DNI son obligatorios.' });
      return;
    }

    const existingStudent = await prisma.student.findUnique({ where: { dni } });
    if (existingStudent) {
      res.status(400).json({ message: 'El DNI ya se encuentra registrado para otro alumno.' });
      return;
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        dni,
        birthDate: birthDate ? new Date(birthDate) : null,
        courseId: courseId || null,
        familyId: familyId || null
      }
    });

    res.status(201).json({ message: 'Alumno registrado exitosamente.', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el alumno.' });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { firstName, lastName, dni, birthDate, courseId, familyId, active } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ message: 'Alumno no encontrado.' });
      return;
    }

    const oldCourseId = student.courseId;
    const newCourseId = courseId;

    // Remapear calificaciones si el curso cambia y el alumno ya tenía un curso
    if (newCourseId !== undefined && newCourseId !== oldCourseId && oldCourseId !== null && newCourseId !== null) {
      const oldSubjects = await prisma.subject.findMany({ where: { courseId: oldCourseId } });
      const newSubjects = await prisma.subject.findMany({ where: { courseId: newCourseId } });

      const updates = [];
      for (const oldSub of oldSubjects) {
        const matchingNewSub = newSubjects.find(
          ns => ns.name.toLowerCase().trim() === oldSub.name.toLowerCase().trim()
        );

        if (matchingNewSub) {
          updates.push(
            prisma.grade.updateMany({
              where: {
                studentId: id,
                subjectId: oldSub.id
              },
              data: {
                subjectId: matchingNewSub.id
              }
            })
          );
        }
      }

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        dni,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        courseId: courseId !== undefined ? courseId : undefined,
        familyId: familyId !== undefined ? familyId : undefined,
        active: active !== undefined ? active : undefined
      }
    });

    res.json({ message: 'Datos del alumno actualizados.', student: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el alumno.' });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ message: 'Alumno no encontrado.' });
      return;
    }

    await prisma.student.update({
      where: { id },
      data: { active: false }
    });
    res.json({ message: 'Alumno inactivado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el alumno.' });
  }
};

// 4. Promover alumnos al finalizar el ciclo lectivo
export const promoteStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repeatingStudentIds } = req.body;
    const repeatIds = Array.isArray(repeatingStudentIds) ? repeatingStudentIds : [];

    // Obtener alumnos activos con curso asignado
    const students = await prisma.student.findMany({
      where: {
        active: true,
        courseId: { not: null }
      },
      include: {
        course: true
      }
    });

    // Obtener todos los cursos
    const courses = await prisma.course.findMany();
    const updates = [];

    for (const student of students) {
      const currentCourse = student.course;
      if (!currentCourse) continue;

      if (repeatIds.includes(student.id)) {
        // Repite: se queda en el mismo curso
        continue;
      }

      // Promueve: busca curso con year + 1, misma división y turno
      const nextCourse = courses.find(
        c => c.year === currentCourse.year + 1 &&
             c.division === currentCourse.division &&
             c.shift === currentCourse.shift
      );

      updates.push(
        prisma.student.update({
          where: { id: student.id },
          data: {
            courseId: nextCourse ? nextCourse.id : null // Si no hay nivel siguiente, se gradúa
          }
        })
      );
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    res.json({
      message: 'Proceso de promoción finalizado.',
      totalProcessed: students.length,
      promotedCount: updates.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar la promoción de alumnos.' });
  }
};
