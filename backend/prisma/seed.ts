import { Role, Shift } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db';

async function main() {
  console.log('Iniciando el seeder de pruebas completo...');

  const passwordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('colegio123', 10);

  // 1. Cuenta Directivo (Administrador)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@colegio.edu.ar' },
    update: {},
    create: {
      email: 'admin@colegio.edu.ar',
      password: passwordHash,
      name: 'Director',
      lastName: 'General',
      dni: '10000000',
      role: Role.DIRECTIVO,
    }
  });
  console.log('✓ Directivo creado.');

  // 2. Preceptores
  const preceptor1 = await prisma.user.upsert({
    where: { email: 'preceptor1@colegio.edu.ar' },
    update: {},
    create: {
      email: 'preceptor1@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Carlos',
      lastName: 'Spinetta',
      dni: '11111111',
      role: Role.PRECEPTOR,
    }
  });

  const preceptor2 = await prisma.user.upsert({
    where: { email: 'preceptor2@colegio.edu.ar' },
    update: {},
    create: {
      email: 'preceptor2@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Patricia',
      lastName: 'Sosa',
      dni: '11111112',
      role: Role.PRECEPTOR,
    }
  });
  console.log('✓ 2 Preceptores creados.');

  // 3. Profesores / Docentes (4 en total)
  const docente1 = await prisma.user.upsert({
    where: { email: 'docente1@colegio.edu.ar' },
    update: {},
    create: {
      email: 'docente1@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Luis Alberto',
      lastName: 'Spinetta',
      dni: '22222221',
      role: Role.DOCENTE,
    }
  });

  const docente2 = await prisma.user.upsert({
    where: { email: 'docente2@colegio.edu.ar' },
    update: {},
    create: {
      email: 'docente2@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Gustavo',
      lastName: 'Cerati',
      dni: '22222222',
      role: Role.DOCENTE,
    }
  });

  const docente3 = await prisma.user.upsert({
    where: { email: 'docente3@colegio.edu.ar' },
    update: {},
    create: {
      email: 'docente3@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Charly',
      lastName: 'García',
      dni: '22222223',
      role: Role.DOCENTE,
    }
  });

  const docente4 = await prisma.user.upsert({
    where: { email: 'docente4@colegio.edu.ar' },
    update: {},
    create: {
      email: 'docente4@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Fito',
      lastName: 'Páez',
      dni: '22222224',
      role: Role.DOCENTE,
    }
  });
  console.log('✓ 4 Docentes creados.');

  // 4. Cursos (1°A y 2°A)
  const curso1A = await prisma.course.upsert({
    where: { year_division_shift: { year: 1, division: 'A', shift: Shift.MANANA } },
    update: { preceptorId: preceptor1.id },
    create: {
      year: 1,
      division: 'A',
      shift: Shift.MANANA,
      preceptorId: preceptor1.id
    }
  });

  const curso2A = await prisma.course.upsert({
    where: { year_division_shift: { year: 2, division: 'A', shift: Shift.MANANA } },
    update: { preceptorId: preceptor2.id },
    create: {
      year: 2,
      division: 'A',
      shift: Shift.MANANA,
      preceptorId: preceptor2.id
    }
  });
  console.log('✓ Cursos 1ºA y 2ºA creados.');

  // 5. Materias (Matemática y Ed Fisica para cada curso)
  // Materias 1°A
  await prisma.subject.create({
    data: {
      name: 'Matemática',
      courseId: curso1A.id,
      teacherId: docente1.id
    }
  });

  await prisma.subject.create({
    data: {
      name: 'Ed Fisica',
      courseId: curso1A.id,
      teacherId: docente2.id
    }
  });

  // Materias 2°A
  await prisma.subject.create({
    data: {
      name: 'Matemática',
      courseId: curso2A.id,
      teacherId: docente3.id
    }
  });

  await prisma.subject.create({
    data: {
      name: 'Ed Fisica',
      courseId: curso2A.id,
      teacherId: docente4.id
    }
  });
  console.log('✓ Materias Matemática y Ed Fisica creadas para ambos cursos.');

  // 6. Familias
  const familia1 = await prisma.user.upsert({
    where: { email: 'familia1@colegio.edu.ar' },
    update: {},
    create: {
      email: 'familia1@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Familia',
      lastName: 'Pérez',
      dni: '33333331',
      role: Role.FAMILIA,
    }
  });

  const familia2 = await prisma.user.upsert({
    where: { email: 'familia2@colegio.edu.ar' },
    update: {},
    create: {
      email: 'familia2@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Familia',
      lastName: 'González',
      dni: '33333332',
      role: Role.FAMILIA,
    }
  });
  console.log('✓ 2 Familias creadas.');

  // 7. Alumnos inscritos en 1°A
  const alumno1 = await prisma.student.upsert({
    where: { dni: '44444441' },
    update: { courseId: curso1A.id, familyId: familia1.id },
    create: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '44444441',
      courseId: curso1A.id,
      familyId: familia1.id
    }
  });

  const alumno2 = await prisma.student.upsert({
    where: { dni: '44444442' },
    update: { courseId: curso1A.id, familyId: familia2.id },
    create: {
      firstName: 'Ana',
      lastName: 'González',
      dni: '44444442',
      courseId: curso1A.id,
      familyId: familia2.id
    }
  });
  console.log('✓ 2 Alumnos creados e inscritos en 1º A.');

  console.log('Seeder de pruebas finalizado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
