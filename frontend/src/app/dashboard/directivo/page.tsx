'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/services/api';
import StudentHistoryModal from '@/components/StudentHistoryModal';
import styles from './directivo.module.css';

interface Course {
  id: string;
  year: number;
  division: string;
  shift: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  course: Course | null;
}

export default function DirectivoDashboard() {
  const { user } = useAuth();

  // Courses & Students state
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  
  // Communication form state
  const [commTitle, setCommTitle] = useState<string>('');
  const [commContent, setCommContent] = useState<string>('');
  const [commTargetCourseId, setCommTargetCourseId] = useState<string>('');
  const [sendingComm, setSendingComm] = useState<boolean>(false);
  const [commMessage, setCommMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch courses & students
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, studentsData] = await Promise.all([
          apiGet('/preceptor/courses'),
          apiGet('/admin/students')
        ]);
        setCourses(coursesData || []);
        setStudents(studentsData || []);
      } catch (err: any) {
        console.error('Error loading data for directivo:', err);
      }
    };
    fetchData();
  }, []);

  // Submit communication notice
  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle || !commContent) {
      setCommMessage({ type: 'error', text: 'El título y el contenido son obligatorios.' });
      return;
    }

    setSendingComm(true);
    setCommMessage(null);

    const payload = {
      title: commTitle,
      content: commContent,
      targetCourseId: commTargetCourseId || null,
    };

    try {
      await apiPost('/communications', payload);
      setCommMessage({
        type: 'success',
        text: 'Comunicado emitido y publicado con éxito para la comunidad escolar.',
      });
      // Reset form
      setCommTitle('');
      setCommContent('');
      setCommTargetCourseId('');
    } catch (err: any) {
      console.error('Error sending directivo communication:', err);
      setCommMessage({
        type: 'error',
        text: err.message || 'Error al emitir el comunicado.',
      });
    } finally {
      setSendingComm(false);
    }
  };

  const filteredStudents = studentSearch.trim() === '' ? [] : students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.dni}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  ).slice(0, 6);

  return (
    <ProtectedRoute allowedRoles={['DIRECTIVO']}>
      <div className={styles.container}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>
              Bienvenido/a, {user?.name || 'Directivo'}!
              <span className={styles.roleBadge}>Directivo</span>
            </h1>
            <p className={styles.welcomeDesc}>
              Panel central de administración institucional. Gestiona el personal, estudiantes, cursos, materias y comunicados oficiales.
            </p>
          </div>
        </div>

        {/* Sección 1: Hub de Gestión ABM */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-primary)' }}>
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            Gestión Institucional (ABM)
          </h2>
          <p className={styles.sectionSubtitle}>Selecciona el módulo administrativo que deseas gestionar:</p>
        </div>

        {/* 5 Tarjetas ABM Responsivas */}
        <div className={styles.abmGrid}>
          {/* 1. Personal */}
          <Link href="/dashboard/admin/users" className={styles.abmCard}>
            <div className={styles.abmCardHeader}>
              <div className={styles.abmIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <h3 className={styles.abmTitle}>Gestión de Personal</h3>
            <p className={styles.abmDesc}>Alta, baja y permisos de Directivos, Secretarios, Preceptores y Docentes.</p>
            <div className={styles.abmFooter}>
              <span>Gestionar Personal</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          {/* 2. Estudiantes */}
          <Link href="/dashboard/admin/students" className={styles.abmCard}>
            <div className={styles.abmCardHeader}>
              <div className={`${styles.abmIcon} ${styles.abmIconPurple}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <circle cx="12" cy="10" r="2" />
                  <path d="M10 14h4" />
                </svg>
              </div>
            </div>
            <h3 className={styles.abmTitle}>Gestión de Alumnos</h3>
            <p className={styles.abmDesc}>Matriculación de estudiantes, legajos escolares y generación de accesos.</p>
            <div className={styles.abmFooter}>
              <span>Gestionar Alumnos</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          {/* 3. Cursos */}
          <Link href="/dashboard/admin/academic?tab=courses" className={styles.abmCard}>
            <div className={styles.abmCardHeader}>
              <div className={`${styles.abmIcon} ${styles.abmIconEmerald}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
            </div>
            <h3 className={styles.abmTitle}>Gestión de Cursos</h3>
            <p className={styles.abmDesc}>Configuración de Años lectivos, Divisiones y Turnos institucionales.</p>
            <div className={styles.abmFooter}>
              <span>Gestionar Cursos</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          {/* 4. Materias y Asignación Docente */}
          <Link href="/dashboard/admin/academic?tab=subjects" className={styles.abmCard}>
            <div className={styles.abmCardHeader}>
              <div className={`${styles.abmIcon} ${styles.abmIconAmber}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
            </div>
            <h3 className={styles.abmTitle}>Materias y Asignación</h3>
            <p className={styles.abmDesc}>Asignaturas por curso y vinculación de profesores titulares a cada materia.</p>
            <div className={styles.abmFooter}>
              <span>Gestionar Materias</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          {/* 5. Cierre Lectivo */}
          <Link href="/dashboard/admin/promote" className={styles.abmCard}>
            <div className={styles.abmCardHeader}>
              <div className={`${styles.abmIcon} ${styles.abmIconRose}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                </svg>
              </div>
            </div>
            <h3 className={styles.abmTitle}>Cierre Lectivo</h3>
            <p className={styles.abmDesc}>Cierre anual del ciclo escolar, promoción masiva de alumnos y graduación.</p>
            <div className={styles.abmFooter}>
              <span>Procesar Cierre</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        </div>

        {/* Sección 2: Operaciones Rápidas (Buscador Historial y Comunicados) */}
        <div className={styles.operationsGrid}>
          {/* Tarjeta de Consulta de Historial Académico */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelCardTitle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-primary)' }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar Historial Académico de Alumno
            </h3>
            <p className={styles.panelCardDesc}>
              Consulta la trayectoria, legajo, notas y asistencias de cualquier estudiante ingresando su Nombre, Apellido o DNI.
            </p>

            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Buscar por Nombre, Apellido o DNI..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                {studentSearch && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setStudentSearch('')}
                    title="Limpiar búsqueda"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>

              {studentSearch.trim() !== '' && (
                <div className={styles.searchResultsList}>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        className={styles.searchResultItem}
                        onClick={() => setHistoryStudentId(s.id)}
                      >
                        <div className={styles.studentInfo}>
                          <div className={styles.studentAvatar}>
                            {s.firstName ? s.firstName[0] : 'A'}{s.lastName ? s.lastName[0] : ''}
                          </div>
                          <div>
                            <div className={styles.studentName}>{s.lastName}, {s.firstName}</div>
                            <div className={styles.studentSub}>
                              DNI: {s.dni} {s.course ? `• ${s.course.year}° "${s.course.division}" (${s.course.shift})` : '• Sin curso'}
                            </div>
                          </div>
                        </div>
                        <span className={styles.viewHistoryBadge}>
                          Ver Historial
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptySearch}>
                      No se encontraron alumnos coincidentes con &ldquo;{studentSearch}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Comunicados Institucionales */}
          <div className={styles.panelCard}>
            <h3 className={styles.panelCardTitle}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-primary)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Emitir Comunicado Institucional
            </h3>

            <form onSubmit={handleSendCommunication} className={styles.commForm}>
              {commMessage && (
                <div className={`${styles.alertMessage} ${commMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                  {commMessage.type === 'success' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  )}
                  <span>{commMessage.text}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="commTitle">Título del Aviso</label>
                <input
                  id="commTitle"
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Suspensión de clases / Reunión de familias"
                  value={commTitle}
                  onChange={(e) => setCommTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="commCourse">Segmentación (Alcance)</label>
                <select
                  id="commCourse"
                  className={styles.select}
                  value={commTargetCourseId}
                  onChange={(e) => setCommTargetCourseId(e.target.value)}
                >
                  <option value="">General (Toda la Institución)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      Solo a {course.year}° &ldquo;{course.division}&rdquo; ({course.shift})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="commContent">Contenido del Comunicado</label>
                <textarea
                  id="commContent"
                  className={styles.textarea}
                  placeholder="Escribe el mensaje oficial que verán docentes, preceptores, familias y alumnos..."
                  value={commContent}
                  onChange={(e) => setCommContent(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={sendingComm}
              >
                {sendingComm ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" style={{ opacity: 0.25 }} />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Publicando aviso...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    <span>Publicar Comunicado</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Modal de Historial Académico */}
        {historyStudentId && (
          <StudentHistoryModal
            studentId={historyStudentId}
            onClose={() => setHistoryStudentId(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
