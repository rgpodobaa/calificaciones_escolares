'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/services/api';
import styles from './alumno.module.css';

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  course: {
    id: string;
    year: number;
    division: string;
    shift: string;
    preceptor: {
      id: string;
      name: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
}

interface GradeDetail {
  id: string;
  concept: 'TEA' | 'TEP' | 'TED' | null;
  numericValue: number | null;
  comments: string | null;
  updatedAt: string;
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  teacher: {
    id: string;
    name: string;
    lastName: string;
  } | null;
  grades: {
    PRE_INFORME_1: GradeDetail | null;
    CUATRIMESTRE_1: GradeDetail | null;
    PRE_INFORME_2: GradeDetail | null;
    CUATRIMESTRE_2: GradeDetail | null;
    FINAL: GradeDetail | null;
  };
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  justified: number;
  total: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
  justification: string | null;
}

interface BulletinData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
  };
  currentCourse: {
    id: string;
    year: number;
    division: string;
    shift: string;
  } | null;
  academicHistory: Record<string, {
    schoolYear: number;
    course: {
      id: string;
      year: number;
      division: string;
      shift: string;
    } | null;
    subjects: SubjectGrade[];
  }>;
  attendanceSummary: AttendanceSummary;
  attendanceRecords: AttendanceRecord[];
}

interface Communication {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    lastName: string;
    role: string;
  };
  targetCourse: {
    year: number;
    division: string;
  } | null;
}

export default function AlumnoDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  
  const [activeTab, setActiveTab] = useState<'boletin' | 'asistencia' | 'comunicados'>('boletin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Cargar legajo del alumno autenticado
        const studentData = await apiGet<StudentProfile>('/students/me');
        setStudent(studentData);

        if (studentData?.id) {
          // 2. Cargar boletín consolidado
          const bulletinData = await apiGet<BulletinData>(`/students/${studentData.id}/boletin`);
          setBulletin(bulletinData);
        }

        // 3. Cargar comunicados
        const commData = await apiGet<Communication[]>('/communications');
        setCommunications(commData || []);
      } catch (err: any) {
        console.error('Error al cargar datos del alumno:', err);
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  // Helper para renderizar badge de concepto (TEA/TEP/TED) o nota numérica
  const renderGrade = (grade: GradeDetail | null) => {
    if (!grade) return <span style={{ color: 'var(--text-secondary)' }}>-</span>;
    
    if (grade.concept) {
      const badgeClass = 
        grade.concept === 'TEA' ? styles.badgeTea :
        grade.concept === 'TEP' ? styles.badgeTep : styles.badgeTed;
      return <span className={badgeClass}>{grade.concept}</span>;
    }

    if (grade.numericValue !== null && grade.numericValue !== undefined) {
      return <strong>{grade.numericValue}</strong>;
    }

    return <span style={{ color: 'var(--text-secondary)' }}>-</span>;
  };

  return (
    <ProtectedRoute allowedRoles={['ALUMNO']}>
      <div className={styles.container}>
        {/* Header con Perfil del Alumno */}
        <div className={styles.studentHeaderCard}>
          <div className={styles.studentInfo}>
            <div className={styles.avatarCircle}>
              {student ? `${student.firstName[0]}${student.lastName[0]}` : user?.name?.[0] || 'A'}
            </div>
            <div className={styles.studentDetails}>
              <h1>{student ? `${student.firstName} ${student.lastName}` : `${user?.name} ${user?.lastName}`}</h1>
              <div className={styles.studentSub}>
                <span>DNI: <strong>{student?.dni || user?.email}</strong></span>
                {student?.course && (
                  <span className={styles.badgeTag}>
                    {student.course.year}° "{student.course.division}" ({student.course.shift})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'boletin' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('boletin')}
          >
            📋 Boletín de Calificaciones
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'asistencia' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('asistencia')}
          >
            📅 Control de Inasistencias
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'comunicados' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('comunicados')}
          >
            📢 Comunicados ({communications.length})
          </button>
        </div>

        {/* Estado de Carga / Error */}
        {loading && <div className={styles.loadingSpinner}>Cargando información académica...</div>}
        {error && <div className={styles.emptyState}>{error}</div>}

        {!loading && !error && (
          <>
            {/* VISTA: BOLETÍN DIGITAL */}
            {activeTab === 'boletin' && (
              <div className={styles.tableCard}>
                <h2 className={styles.tableTitle}>Calificaciones del Ciclo Lectivo Actual</h2>
                
                {bulletin?.academicHistory && Object.keys(bulletin.academicHistory).length > 0 ? (
                  Object.entries(bulletin.academicHistory).map(([key, historyGroup]) => (
                    <table key={key} className={styles.table}>
                      <thead>
                        <tr>
                          <th>Materia</th>
                          <th>Docente</th>
                          <th>Pre-Inf 1</th>
                          <th>1° Cuat.</th>
                          <th>Pre-Inf 2</th>
                          <th>2° Cuat.</th>
                          <th>Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyGroup.subjects.map((sub) => (
                          <tr key={sub.subjectId}>
                            <td><strong>{sub.subjectName}</strong></td>
                            <td>{sub.teacher ? `${sub.teacher.name} ${sub.teacher.lastName}` : 'Por asignar'}</td>
                            <td>{renderGrade(sub.grades.PRE_INFORME_1)}</td>
                            <td>{renderGrade(sub.grades.CUATRIMESTRE_1)}</td>
                            <td>{renderGrade(sub.grades.PRE_INFORME_2)}</td>
                            <td>{renderGrade(sub.grades.CUATRIMESTRE_2)}</td>
                            <td>{renderGrade(sub.grades.FINAL)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))
                ) : (
                  <div className={styles.emptyState}>Aún no hay calificaciones registradas para este ciclo lectivo.</div>
                )}
              </div>
            )}

            {/* VISTA: ASISTENCIAS */}
            {activeTab === 'asistencia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Resumen de Asistencias */}
                <div className={styles.gridSummary}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Presentes</span>
                    <span className={styles.statValue} style={{ color: '#059669' }}>
                      {bulletin?.attendanceSummary.present || 0}
                    </span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Inasistencias</span>
                    <span className={styles.statValue} style={{ color: '#dc2626' }}>
                      {bulletin?.attendanceSummary.absent || 0}
                    </span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Tardanzas</span>
                    <span className={styles.statValue} style={{ color: '#d97706' }}>
                      {bulletin?.attendanceSummary.late || 0}
                    </span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Justificadas</span>
                    <span className={styles.statValue} style={{ color: '#2563eb' }}>
                      {bulletin?.attendanceSummary.justified || 0}
                    </span>
                  </div>
                </div>

                {/* Tabla Detallada de Asistencias */}
                <div className={styles.tableCard}>
                  <h2 className={styles.tableTitle}>Registro de Asistencia Diaria</h2>
                  {bulletin?.attendanceRecords && bulletin.attendanceRecords.length > 0 ? (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Estado</th>
                          <th>Justificación / Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulletin.attendanceRecords.map((att) => (
                          <tr key={att.id}>
                            <td>{att.date}</td>
                            <td>
                              <span className={
                                att.status === 'PRESENT' ? styles.statusPresent :
                                att.status === 'ABSENT' ? styles.statusAbsent :
                                att.status === 'LATE' ? styles.statusLate : styles.statusJustified
                              }>
                                {att.status === 'PRESENT' ? 'Presente' :
                                 att.status === 'ABSENT' ? 'Ausente' :
                                 att.status === 'LATE' ? 'Tarde' : 'Justificado'}
                              </span>
                            </td>
                            <td>{att.justification || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyState}>No hay registros de asistencia hasta el momento.</div>
                  )}
                </div>
              </div>
            )}

            {/* VISTA: COMUNICADOS */}
            {activeTab === 'comunicados' && (
              <div className={styles.commList}>
                {communications.length > 0 ? (
                  communications.map((comm) => (
                    <div key={comm.id} className={styles.commCard}>
                      <div className={styles.commTitle}>{comm.title}</div>
                      <div className={styles.commMeta}>
                        Emitido por <strong>{comm.author.name} {comm.author.lastName} ({comm.author.role})</strong> — {new Date(comm.createdAt).toLocaleDateString()}
                      </div>
                      <div className={styles.commContent}>{comm.content}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No tienes comunicados pendientes.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
