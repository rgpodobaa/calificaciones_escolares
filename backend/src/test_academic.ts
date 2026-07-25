import { prisma } from './config/db';
import { Role, GradePeriod, ConceptGrade, AttendanceStatus, Shift } from '@prisma/client';
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
          'alumno_test@colegio.edu.ar'
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
      email: 'alumno_test@colegio.edu.ar',
      password: passwordHash,
      role: Role.ALUMNO,
      name: 'Juan',
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
      shift: Shift.MANANA,
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

  // 4. Crear Alumno y relacionar
  console.log('Creando alumno...');
  const alumno = await prisma.student.create({
    data: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dni: '55666777',
      birthDate: new Date('2012-04-15'),
      courseId: curso.id,
      userId: familia.id
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
    user: { id: familia.id, role: Role.ALUMNO },
    params: { studentId: alumno.id }
  };
  const resReportCard = makeMockResponse();
  await studentController.getStudentReportCard(reqReportCard, resReportCard);
  
  const reportData = resReportCard.jsonData;
  assert(reportData.student.firstName === 'Juan', 'Nombre del estudiante incorrecto');
  
  const currentYear = new Date().getFullYear();
  const historyKey = Object.keys(reportData.academicHistory).find(k => k.startsWith(String(currentYear)));
  assert(historyKey !== undefined, 'Debe existir historial para el año actual');
  const history = reportData.academicHistory[historyKey!];
  assert(history.subjects.length === 1, 'Debe haber una materia en el año actual');
  assert(history.subjects[0].grades.PRE_INFORME_1.concept === 'TEA', 'Pre-informe incorrecto en boletín');
  assert(history.subjects[0].grades.CUATRIMESTRE_1.numericValue === 8.0, 'Cuatrimestre incorrecto en boletín');
  assert(history.subjects[0].grades.FINAL.numericValue === 9.0, 'Nota final incorrecta en boletín');
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
    body: { title: 'Otro Alumno', content: 'Mensaje privado', targetStudentId: 'some-other-id' }
  };
  const resCommOtraFam = makeMockResponse();
  await communicationController.createCommunication(reqCommOtraFam, resCommOtraFam);

  // 4d. Obtener comunicados como Familia (debe ver General y Curso 1A, pero NO el de otra familia)
  const reqGetComm: any = {
    user: { id: familia.id, role: Role.ALUMNO }
  };
  const resGetComm = makeMockResponse();
  await communicationController.getCommunications(reqGetComm, resGetComm);
  
  const commList = resGetComm.jsonData;
  assert(commList.length === 2, `La familia debió ver exactamente 2 comunicados, pero vio ${commList.length}`);
  assert(commList.some((c: any) => c.title === 'General'), 'No ve comunicado general');
  assert(commList.some((c: any) => c.title === 'Curso 1A'), 'No ve comunicado del curso de su hijo');
  assert(!commList.some((c: any) => c.title === 'Otra Familia'), 'Ve un comunicado privado de otra familia!');

  // ==========================================
  // PRUEBA 5: Borrado Lógico (Inactivación)
  // ==========================================
  console.log('Prueba 5: Borrado Lógico (Soft Delete) y Filtros...');

  const adminController = require('./controllers/admin.controller');
  const authController = require('./controllers/auth.controller');

  // 5a. Inactivar el docente de prueba
  const reqInactivateTeacher: any = {
    params: { id: docente.id }
  };
  const resInactivateTeacher = makeMockResponse();
  await adminController.deleteUser(reqInactivateTeacher, resInactivateTeacher);
  assert(resInactivateTeacher.statusCode === undefined || resInactivateTeacher.statusCode === 200, 'Fallo al inactivar docente');

  // Verificar que el docente inactivo no puede iniciar sesión
  const reqLoginDocente: any = {
    body: { email: 'docente_test@colegio.edu.ar', password: 'password123' }
  };
  const resLoginDocente = makeMockResponse();
  await authController.login(reqLoginDocente, resLoginDocente);
  assert(resLoginDocente.statusCode === 401, 'El docente inactivo no debió poder hacer login');

  // 5b. Inactivar al alumno de prueba
  const reqInactivateStudent: any = {
    params: { id: alumno.id }
  };
  const resInactivateStudent = makeMockResponse();
  await adminController.deleteStudent(reqInactivateStudent, resInactivateStudent);
  assert(resInactivateStudent.statusCode === undefined || resInactivateStudent.statusCode === 200, 'Fallo al inactivar alumno');

  // Verificar que el alumno inactivo no aparece en getCourseStudents (Preceptor)
  const reqGetCourseStudents: any = {
    user: { id: preceptor.id, role: Role.PRECEPTOR },
    params: { courseId: curso.id }
  };
  const resGetCourseStudents = makeMockResponse();
  await preceptorController.getCourseStudents(reqGetCourseStudents, resGetCourseStudents);
  const courseStudents = resGetCourseStudents.jsonData;
  assert(!courseStudents.some((s: any) => s.id === alumno.id), 'El alumno inactivo no debería aparecer en la lista de alumnos del curso');

  // Verificar que el alumno inactivo no aparece en getSubjectStudents (Docente)
  const reqGetSubjectStudents: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    params: { subjectId: materia.id }
  };
  const resGetSubjectStudents = makeMockResponse();
  await teacherController.getSubjectStudents(reqGetSubjectStudents, resGetSubjectStudents);
  const subjectStudents = resGetSubjectStudents.jsonData.students;
  assert(!subjectStudents.some((s: any) => s.studentId === alumno.id), 'El alumno inactivo no debería aparecer en la lista de la materia del docente');

  // Verificar que los datos históricos de notas del alumno inactivo sigan existiendo en la DB
  const dbGrades = await prisma.grade.findMany({
    where: { studentId: alumno.id }
  });
  assert(dbGrades.length > 0, 'Las notas históricas del alumno se eliminaron físicamente!');

  // ==========================================
  // PRUEBA 6: Traspaso de Curso (Remapeo de notas)
  // ==========================================
  console.log('Prueba 6: Traspaso de Curso (Remapeo de notas)...');

  // Reactivar al alumno de prueba
  await prisma.student.update({
    where: { id: alumno.id },
    data: { active: true }
  });

  // Crear un nuevo curso de destino (1º B)
  const cursoB = await prisma.course.create({
    data: {
      year: 1,
      division: 'B',
      shift: 'MANANA'
    }
  });

  // Crear la misma materia "Matemática I" en el Curso B
  const materiaB = await prisma.subject.create({
    data: {
      name: 'Matemática I',
      courseId: cursoB.id,
      teacherId: docente.id
    }
  });

  // Transferir al alumno al Curso B usando la API updateStudent
  const reqTransfer: any = {
    params: { id: alumno.id },
    body: {
      firstName: alumno.firstName,
      lastName: alumno.lastName,
      dni: alumno.dni,
      courseId: cursoB.id
    }
  };
  const resTransfer = makeMockResponse();
  await adminController.updateStudent(reqTransfer, resTransfer);
  assert(resTransfer.statusCode === undefined || resTransfer.statusCode === 200, 'Fallo al transferir alumno');

  // Verificar que el alumno pertenece al nuevo curso en la base de datos
  const dbStudentAfterTransfer = await prisma.student.findUnique({
    where: { id: alumno.id }
  });
  assert(dbStudentAfterTransfer?.courseId === cursoB.id, 'El alumno no se actualizó al curso de destino');

  // Verificar que las calificaciones ahora apuntan a la materia del Curso B (materiaB.id)
  const dbGradesAfterTransfer = await prisma.grade.findMany({
    where: { studentId: alumno.id }
  });

  assert(dbGradesAfterTransfer.length > 0, 'Las notas desaparecieron durante la transferencia');
  assert(dbGradesAfterTransfer.every(g => g.subjectId === materiaB.id), 'Alguna nota no se remapeó correctamente a la materia del nuevo curso');

  // ==========================================
  // PRUEBA 7: Cierre de Ciclo y Promoción de Alumnos
  // ==========================================
  console.log('Prueba 7: Cierre de Ciclo y Promoción de Alumnos...');

  // Asegurar que la nota de Matemática I que tiene Juan de Prueba 6 tenga el schoolYear 2026
  await prisma.grade.updateMany({
    where: { studentId: alumno.id },
    data: { schoolYear: 2026 }
  });

  // Crear curso 2º B en la institución
  const curso2B = await prisma.course.create({
    data: {
      year: 2,
      division: 'B',
      shift: 'MANANA'
    }
  });

  // Crear materia "Matemática II" en 2º B
  const materia2B = await prisma.subject.create({
    data: {
      name: 'Matemática II',
      courseId: curso2B.id,
      teacherId: docente.id
    }
  });

  // Ejecutar promoción de alumnos
  const reqPromote: any = {
    body: {
      repeatingStudentIds: [] // Juan no repite, se promueve!
    }
  };
  const resPromote = makeMockResponse();
  await adminController.promoteStudents(reqPromote, resPromote);
  assert(resPromote.statusCode === undefined || resPromote.statusCode === 200, 'Fallo al ejecutar la promoción');

  // Verificar que Juan fue promovido a 2º B
  const dbStudentAfterPromotion = await prisma.student.findUnique({
    where: { id: alumno.id }
  });
  assert(dbStudentAfterPromotion?.courseId === curso2B.id, 'Juan debió ser promovido a 2º B');

  // Cargar una calificación para Juan en Matemática II (Curso 2º B) para el ciclo 2027
  const reqGrade2027: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: alumno.id,
      subjectId: materia2B.id,
      period: GradePeriod.CUATRIMESTRE_1,
      numericValue: 9.0,
      schoolYear: 2027
    }
  };
  const resGrade2027 = makeMockResponse();
  await teacherController.upsertGrade(reqGrade2027, resGrade2027);
  assert(resGrade2027.jsonData.grade.schoolYear === 2027, 'No se guardó el ciclo 2027');

  // Cargar una calificación para OTRO estudiante en la materia Matemática I (Curso 1º B) para el ciclo 2027 (simulando que la materia estática Matemática I se sigue dictando y no colisiona con el ciclo 2026 de Juan)
  const otroAlumno = await prisma.student.create({
    data: {
      firstName: 'Pedro',
      lastName: 'Gómez',
      dni: '88777666',
      courseId: cursoB.id
    }
  });

  const reqGradeOtro2027: any = {
    user: { id: docente.id, role: Role.DOCENTE },
    body: {
      studentId: otroAlumno.id,
      subjectId: materiaB.id,
      period: GradePeriod.CUATRIMESTRE_1,
      numericValue: 7.0,
      schoolYear: 2027
    }
  };
  const resGradeOtro2027 = makeMockResponse();
  await teacherController.upsertGrade(reqGradeOtro2027, resGradeOtro2027);
  assert(resGradeOtro2027.jsonData.grade.schoolYear === 2027, 'No se guardó el ciclo 2027 para el otro alumno');

  // Consultar boletín de Juan y verificar agrupación
  const reqBoletinHist: any = {
    user: { id: familia.id, role: Role.ALUMNO },
    params: { studentId: alumno.id }
  };
  const resBoletinHist = makeMockResponse();
  await studentController.getStudentReportCard(reqBoletinHist, resBoletinHist);
  
  const boletinHist = resBoletinHist.jsonData.academicHistory;
  const keys = Object.keys(boletinHist);
  assert(keys.some(k => k.startsWith('2026')), 'No figura el boletín histórico 2026');
  assert(keys.some(k => k.startsWith('2027')), 'No figura el boletín del año actual 2027');
  
  // Limpiar datos creados en Prueba 7
  await prisma.grade.deleteMany({ where: { studentId: { in: [alumno.id, otroAlumno.id] } } });
  await prisma.student.delete({ where: { id: otroAlumno.id } });
  await prisma.subject.delete({ where: { id: materia2B.id } });
  await prisma.course.delete({ where: { id: curso2B.id } });

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
