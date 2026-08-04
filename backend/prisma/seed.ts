import { Role, Shift } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db';

async function main() {
  console.log('Restableciendo base de datos y creando escenario específico (Curso 1°A TM, Materia, Docente, Preceptor y Alumno)...');

  const userPasswordHash = await bcrypt.hash('colegio123', 10);

  // 1. Directivo
  const directivo = await prisma.user.upsert({
    where: { email: 'directivo@colegio.edu.ar' },
    update: { password: userPasswordHash, role: Role.DIRECTIVO },
    create: {
      email: 'directivo@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Director',
      lastName: 'General',
      dni: '10000000',
      role: Role.DIRECTIVO,
    }
  });
  console.log('✓ 1 Directivo creado (directivo@colegio.edu.ar).');

  // 2. Preceptor
  const preceptor = await prisma.user.upsert({
    where: { email: 'preceptor@colegio.edu.ar' },
    update: { password: userPasswordHash, role: Role.PRECEPTOR },
    create: {
      email: 'preceptor@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Carlos',
      lastName: 'Preceptor',
      dni: '12000000',
      role: Role.PRECEPTOR,
    }
  });
  console.log('✓ 1 Preceptor creado (preceptor@colegio.edu.ar).');

  // 3. Docente de Matemática
  const docente = await prisma.user.upsert({
    where: { email: 'docente@colegio.edu.ar' },
    update: { password: userPasswordHash, role: Role.DOCENTE },
    create: {
      email: 'docente@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Luis',
      lastName: 'Docente (Matemática)',
      dni: '20000001',
      role: Role.DOCENTE,
    }
  });
  console.log('✓ 1 Docente de Matemática creado (docente@colegio.edu.ar).');

  // 4. Curso 1° A Turno Mañana
  const curso1A = await prisma.course.upsert({
    where: {
      year_division_shift: {
        year: 1,
        division: 'A',
        shift: Shift.MANANA
      }
    },
    update: { preceptorId: preceptor.id },
    create: {
      year: 1,
      division: 'A',
      shift: Shift.MANANA,
      preceptorId: preceptor.id
    }
  });
  console.log('✓ 1 Curso creado (1° A - Turno Mañana) asignado a Carlos Preceptor.');

  // 5. Materia Matemática en 1° A TM
  const materiaMatematica = await prisma.subject.create({
    data: {
      name: 'Matemática',
      courseId: curso1A.id,
      teacherId: docente.id
    }
  });
  console.log('✓ 1 Materia "Matemática" creada en 1° A TM asignada a Luis Docente.');

  // 6. Cuenta de Usuario para el Alumno
  const studentUser = await prisma.user.upsert({
    where: { email: 'alumno.1a@colegio.edu.ar' },
    update: { password: userPasswordHash, role: Role.ALUMNO },
    create: {
      email: 'alumno.1a@colegio.edu.ar',
      password: userPasswordHash,
      name: 'Juan',
      lastName: 'Pérez',
      dni: '40000001',
      role: Role.ALUMNO
    }
  });

  // 7. Legajo de Alumno en 1° A TM
  const alumno = await prisma.student.upsert({
    where: { dni: '40000001' },
    update: { courseId: curso1A.id, userId: studentUser.id },
    create: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '40000001',
      courseId: curso1A.id,
      userId: studentUser.id
    }
  });
  console.log('✓ 1 Alumno creado (Juan Pérez - DNI 40000001) e inscrito en 1° A TM.');

  console.log('\n==================================================');
  console.log('ESCENARIO CREADO CON ÉXITO');
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
