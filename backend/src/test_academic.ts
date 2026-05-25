import { prisma } from './config/db';
import { Role, GradePeriod, ConceptGrade, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

// Simple assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Mocking express Response for controller testing
const makeMockResponse = () => {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

async function runTests() {
  console.log('--- EMPEZANDO PRUEBAS DE INTEGRACIÓN ---');

  // 1. Limpieza de datos previos de prueba (para asegurar idempotencia)
  console.log('Limpiando base de datos de pruebas...');
  await prisma.grade.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.communication.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'preceptor_test@colegio.edu.ar',
          'docente_test@colegio.edu.ar',
          'familia_test@colegio.edu.ar'
        ]
      }
    }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Crear Usuarios de Prueba
  console.log('Creando usuarios de prueba (Preceptor, Docente, Familia)...');
  const preceptor = await prisma.user.create({
    data: {
      email: 'preceptor_test@colegio.edu.ar',
      password: passwordHash,
      role: Role.PRECEPTOR,
      name: 'Néstor',
      lastName: 'Kirchner',
      dni: '99000001'
    }
  });

  const docente = await prisma.user.create({
    data: {
      email: 'docente_test@colegio.edu.ar',
      password: passwordHash,
      role: Role.DOCENTE,
      name: 'Domingo',
      lastName: 'Sarmiento',
      dni: '99000002'
    }
  });

  const familia = await prisma.user.create({
    data: {
      email: 'familia_test@colegio.edu.ar',
      password: passwordHash,
      role: Role.FAMILIA,
      name: 'Familia',
      lastName: 'Pérez',
      dni: '99000003'
    }
  });

  // 3. Crear Curso y Materia
  console.log('Creando curso y materia...');
  const curso = await prisma.course.create({
    data: {
      year: 1,
      division: 'A',
      shift: 'MANANA',
      preceptorId: preceptor.id
    }
  });

  const materia = await prisma.subject.create({
    data: {
      name: 'Matemática I',
      courseId: curso.id,
      teacherId: docente.id
    }
  });

  // 4. Crear Alumno
  console.log('Creando estudiante...');
  const alumno = await prisma.student.create({
    data: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '55666777',
      birthDate: new Date('2012-04-15'),
      courseId: curso.id,
      familyId: familia.id
    }
  });

  // Importar controladores dinámicamente para probar sus lógicas
  const preceptorController = require('./controllers/preceptor.controller');
  const teacherController = require('./controllers/teacher.controller');
  const studentController = require('./controllers/student.controller');
  const communicationController = require('./controllers/communication.controller');

  // ==========================================
  // PRUEBA 1: Toma de Asistencia (Preceptor)
  // ==========================================
  console.log('Prueba 1: Registrar Asistencia...');
  const reqAttendance: any = {
    user: { id: preceptor.id, role: Role.PRECEPTOR },
    body: {
      date: '2026-05-25',
      records: [
        { studentId: alumno.id, status: AttendanceStatus.PRESENT, justification: null }
      ]
    }
  };
  const resAttendance = makeMockResponse();
  await preceptorController.upsertAttendance(reqAttendance, resAttendance);
  assert(resAttendance.statusCode === undefined || resAttendance.statusCode === 200, 'Fallo al registrar asistencia');
  
  // Verificar base de datos
  const dbAttendance = await prisma.attendance.findFirst({
    where: { studentId: alumno.id }
  });
  assert(dbAttendance !== null, 'No se guardó el registro de asistencia');
  assert(dbAttendance?.status === AttendanceStatus.PRESENT, 'El estado de asistencia debe ser PRESENT');

  // ==========================================
  // PRUEBA 2: Carga de Calificaciones (Docente)
  // ==========================================
  console.log('Prueba 2: Carga de Calificaciones (Validación de Negocio)...');
  
  // Caso 2a: Pre-informe válido (Solo conceptual)
  const reqGrade1: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: alumno.id,
      subjectId: materia.id,
      period: GradePeriod.PRE_INFORME_1,
      concept: ConceptGrade.TEA,
      comments: 'Excelente desempeño inicial'
    }
  };
  const resGrade1 = makeMockResponse();
  await teacherController.upsertGrade(reqGrade1, resGrade1);
  assert(resGrade1.jsonData.grade.concept === 'TEA', 'Pre-informe TEA no guardado');

  // Caso 2b: Pre-informe inválido (Envío de nota numérica)
  const reqGrade2: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: alumno.id,
      subjectId: materia.id,
      period: GradePeriod.PRE_INFORME_1,
      concept: ConceptGrade.TEA,
      numericValue: 8.5
    }
  };
  const resGrade2 = makeMockResponse();
  await teacherController.upsertGrade(reqGrade2, resGrade2);
  assert(resGrade2.statusCode === undefined || resGrade2.statusCode === 200, 'Error: la nota numérica debió ser forzada a null');
  assert(resGrade2.jsonData.grade.numericValue === null, 'Pre-informe guardó nota numérica incorrectamente');

  // Caso 2c: Cuatrimestre válido (Nota numérica 8 con concepto TEA)
  const reqGrade3: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: alumno.id,
      subjectId: materia.id,
      period: GradePeriod.CUATRIMESTRE_1,
      numericValue: 8.0
    }
  };
  const resGrade3 = makeMockResponse();
  await teacherController.upsertGrade(reqGrade3, resGrade3);
  assert(resGrade3.jsonData.grade.concept === 'TEA', 'Concepto TEA debió ser autocalculado para nota 8.0');

  // Caso 2d: Cuatrimestre inválido (Inconsistencia: nota 5 con TEA)
  const reqGrade4: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: alumno.id,
      subjectId: materia.id,
      period: GradePeriod.CUATRIMESTRE_1,
      concept: ConceptGrade.TEA,
      numericValue: 5.0
    }
  };
  const resGrade4 = makeMockResponse();
  await teacherController.upsertGrade(reqGrade4, resGrade4);
  assert(resGrade4.statusCode === 400, 'Debió fallar la correspondencia de nota 5.0 con TEA');

  // Caso 2e: Nota Final válida (Numérica 9, sin concepto)
  const reqGrade5: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: alumno.id,
      subjectId: materia.id,
      period: GradePeriod.FINAL,
      numericValue: 9.0
    }
  };
  const resGrade5 = makeMockResponse();
  await teacherController.upsertGrade(reqGrade5, resGrade5);
  assert(resGrade5.jsonData.grade.numericValue === 9.0 && resGrade5.jsonData.grade.concept === null, 'Fallo en nota final');

  // ==========================================
  // PRUEBA 3: Generación de Boletín
  // ==========================================
  console.log('Prueba 3: Consultar Boletín...');
  const reqReportCard: any = {
    user: { id: familia.id, role: Role.FAMILIA },
    params: { studentId: alumno.id }
  };
  const resReportCard = makeMockResponse();
  await studentController.getStudentReportCard(reqReportCard, resReportCard);
  
  const reportData = resReportCard.jsonData;
  assert(reportData.student.firstName === 'Juan', 'Nombre del estudiante incorrecto');
  assert(reportData.subjects.length === 1, 'Debe haber una materia');
  assert(reportData.subjects[0].grades.PRE_INFORME_1.concept === 'TEA', 'Pre-informe incorrecto en boletín');
  assert(reportData.subjects[0].grades.CUATRIMESTRE_1.numericValue === 8.0, 'Cuatrimestre incorrecto en boletín');
  assert(reportData.subjects[0].grades.FINAL.numericValue === 9.0, 'Nota final incorrecta en boletín');
  assert(reportData.attendanceSummary.present === 1, 'Asistencia "presente" incorrecta');

  // ==========================================
  // PRUEBA 4: Comunicados y Visibilidad
  // ==========================================
  console.log('Prueba 4: Comunicados...');
  
  // 4a. Crear comunicado general
  const reqCommGen: any = {
    user: { id: preceptor.id, role: Role.PRECEPTOR },
    body: { title: 'General', content: 'Comunicado general' }
  };
  const resCommGen = makeMockResponse();
  await communicationController.createCommunication(reqCommGen, resCommGen);

  // 4b. Crear comunicado dirigido a curso
  const reqCommCurso: any = {
    user: { id: preceptor.id, role: Role.PRECEPTOR },
    body: { title: 'Curso 1A', content: 'Aviso para 1A', targetCourseId: curso.id }
  };
  const resCommCurso = makeMockResponse();
  await communicationController.createCommunication(reqCommCurso, resCommCurso);

  // 4c. Crear comunicado dirigido a otra familia (que no es la de Juan)
  const reqCommOtraFam: any = {
    user: { id: preceptor.id, role: Role.PRECEPTOR },
    body: { title: 'Otra Familia', content: 'Mensaje privado', targetFamilyId: 'some-other-id' }
  };
  const resCommOtraFam = makeMockResponse();
  await communicationController.createCommunication(reqCommOtraFam, resCommOtraFam);

  // 4d. Obtener comunicados como Familia (debe ver General y Curso 1A, pero NO el de otra familia)
  const reqGetComm: any = {
    user: { id: familia.id, role: Role.FAMILIA }
  };
  const resGetComm = makeMockResponse();
  await communicationController.getCommunications(reqGetComm, resGetComm);
  
  const commList = resGetComm.jsonData;
  assert(commList.length === 2, `La familia debió ver exactamente 2 comunicados, pero vio ${commList.length}`);
  assert(commList.some((c: any) => c.title === 'General'), 'No ve comunicado general');
  assert(commList.some((c: any) => c.title === 'Curso 1A'), 'No ve comunicado del curso de su hijo');
  assert(!commList.some((c: any) => c.title === 'Otra Familia'), 'Ve un comunicado privado de otra familia!');

  console.log('--- TODAS LAS PRUEBAS DE INTEGRACIÓN SE COMPLETARON CON ÉXITO ---');
}

runTests()
  .catch(err => {
    console.error('ERROR EN LAS PRUEBAS:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
