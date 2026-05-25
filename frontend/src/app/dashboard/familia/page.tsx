'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/services/api';
import styles from './familia.module.css';

interface Child {
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
  course: {
    id: string;
    year: number;
    division: string;
    shift: string;
  } | null;
  subjects: SubjectGrade[];
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

type TabType = 'boletin' | 'asistencia' | 'comunicados';

export default function FamiliaDashboard() {
  const { user } = useAuth();

  // Children state
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string>('');

  // Active child bulletin/attendance data
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);
  const [loadingBulletin, setLoadingBulletin] = useState<boolean>(false);

  // Communications list
  const [comms, setComms] = useState<Communication[]>([]);
  const [loadingComms, setLoadingComms] = useState<boolean>(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('boletin');

  // Fetch children on initial load
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await apiGet('/family/students');
        setChildren(data);
        if (data.length > 0) {
          setActiveChildId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching children:', err);
      }
    };
    fetchChildren();
  }, []);

  // Fetch bulletin and attendance details when active child changes
  useEffect(() => {
    if (!activeChildId) return;

    const fetchBulletinData = async () => {
      setLoadingBulletin(true);
      try {
        const data = await apiGet(`/students/${activeChildId}/boletin`);
        setBulletin(data);
      } catch (err: any) {
        console.error('Error fetching child bulletin:', err);
      } finally {
        setLoadingBulletin(false);
      }
    };

    fetchBulletinData();
  }, [activeChildId]);

  // Fetch communications
  useEffect(() => {
    const fetchCommunications = async () => {
      setLoadingComms(true);
      try {
        const data = await apiGet('/communications');
        setComms(data);
      } catch (err: any) {
        console.error('Error fetching communications:', err);
      } finally {
        setLoadingComms(false);
      }
    };

    fetchCommunications();
  }, []);

  // Format date helper (DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date with time helper
  const formatDateWithTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${min}`;
  };

  // Translate role key to spanish text
  const translateRole = (role: string) => {
    switch (role) {
      case 'DIRECTIVO': return 'Dirección';
      case 'SECRETARIO': return 'Secretaría';
      case 'PRECEPTOR': return 'Preceptoría';
      case 'DOCENTE': return 'Docente';
      default: return 'Institución';
    }
  };

  // Filter attendance records to show only absences/tardiness
  const getAbsenceLogs = () => {
    if (!bulletin) return [];
    return bulletin.attendanceRecords
      .filter((r) => r.status !== 'PRESENT')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // sort newest first
  };

  const getActiveChild = () => {
    return children.find((c) => c.id === activeChildId);
  };

  return (
    <ProtectedRoute allowedRoles={['FAMILIA']}>
      <div className={styles.container}>
        
        {/* Welcome Header */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal Familiar</h1>
          <p>
            Realiza el seguimiento diario del boletín académico, las asistencias oficiales y los avisos escolares de tus hijos.
          </p>
        </div>

        {/* Children switcher header card */}
        {children.length > 0 && (
          <div className={styles.childSwitcherCard}>
            <span className={styles.childSwitcherLabel}>Hijos a Cargo</span>
            <div className={styles.childrenList}>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={`${styles.childButton} ${activeChildId === child.id ? styles.childButtonActive : ''}`}
                  onClick={() => {
                    setActiveChildId(child.id);
                    // Reset to boletin tab by default when switching kids
                    setActiveTab('boletin');
                  }}
                >
                  <div className={styles.childAvatar}>
                    {child.firstName[0]}
                  </div>
                  <span>{child.lastName}, {child.firstName}</span>
                  {child.course && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>
                      ({child.course.year}° &ldquo;{child.course.division}&rdquo;)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {activeChildId && (
          <div className={styles.tabNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'boletin' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('boletin')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>Boletín Académico</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'asistencia' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('asistencia')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Reporte de Asistencia</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'comunicados' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('comunicados')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Cuaderno de Comunicados</span>
            </button>
          </div>
        )}

        {/* Tab content renderer */}
        {activeChildId && (
          <div className={styles.tabContent}>
            
            {/* 1. Academic Bulletin Tab */}
            {activeTab === 'boletin' && (
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>Calificaciones Consolidadas</span>
                  </div>
                  {getActiveChild()?.course && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Curso: <strong>{getActiveChild()?.course?.year}° &ldquo;{getActiveChild()?.course?.division}&rdquo;</strong> - Turno {getActiveChild()?.course?.shift}
                    </span>
                  )}
                </div>

                {loadingBulletin ? (
                  <div className={styles.loadingContainer}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <p>Cargando calificaciones del alumno...</p>
                  </div>
                ) : !bulletin || bulletin.subjects.length === 0 ? (
                  <div className={styles.emptyFeed}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>No se encontraron calificaciones registradas para este alumno aún.</p>
                  </div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.bulletinTable}>
                      <thead>
                        <tr>
                          <th>Materia</th>
                          <th>Pre-Informe 1</th>
                          <th>1º Cuatrimestre</th>
                          <th>Pre-Informe 2</th>
                          <th>2º Cuatrimestre</th>
                          <th>Nota Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulletin.subjects.map((sub) => {
                          const periods: ('PRE_INFORME_1' | 'CUATRIMESTRE_1' | 'PRE_INFORME_2' | 'CUATRIMESTRE_2' | 'FINAL')[] = [
                            'PRE_INFORME_1', 'CUATRIMESTRE_1', 'PRE_INFORME_2', 'CUATRIMESTRE_2', 'FINAL'
                          ];

                          return (
                            <tr key={sub.subjectId}>
                              <td>
                                <div>{sub.subjectName}</div>
                                {sub.teacher && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Prof: {sub.teacher.lastName}, {sub.teacher.name}
                                  </div>
                                )}
                              </td>

                              {periods.map((period) => {
                                const grade = sub.grades[period];
                                
                                // Return empty dash if period grade doesn't exist
                                if (!grade) {
                                  return <td key={period}>&mdash;</td>;
                                }

                                // Style conceptual badge
                                let conceptBadge = null;
                                if (grade.concept) {
                                  let badgeStyle = '';
                                  if (grade.concept === 'TEA') badgeStyle = styles.badgeTEA;
                                  if (grade.concept === 'TEP') badgeStyle = styles.badgeTEP;
                                  if (grade.concept === 'TED') badgeStyle = styles.badgeTED;
                                  conceptBadge = (
                                    <span className={badgeStyle} title={grade.comments || ''}>
                                      {grade.concept}
                                    </span>
                                  );
                                }

                                return (
                                  <td key={period}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                      {grade.numericValue !== null && (
                                        <span className={styles.numericGrade}>
                                          {grade.numericValue}
                                        </span>
                                      )}
                                      {conceptBadge}
                                      
                                      {grade.comments && (
                                        <span
                                          className={styles.commentBubble}
                                          title={`Comentario docente: "${grade.comments}"`}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. Attendance Summary & History Logs */}
            {activeTab === 'asistencia' && (
              <div className={styles.panelCard}>
                <div className={styles.panelTitle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Resumen de Asistencia Escolar</span>
                </div>

                {loadingBulletin ? (
                  <div className={styles.loadingContainer}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <p>Cargando resumen de asistencia...</p>
                  </div>
                ) : !bulletin ? (
                  <div className={styles.emptyFeed}>
                    <p>No hay información de presentismo disponible.</p>
                  </div>
                ) : (
                  <>
                    {/* Metric Cards Grid */}
                    <div className={styles.metricsGrid}>
                      <div className={styles.metricCard}>
                        <div className={`${styles.metricIcon} ${styles.bgEmerald}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                          <div className={styles.metricValue}>{bulletin.attendanceSummary.present}</div>
                          <div className={styles.metricLabel}>Presentes</div>
                        </div>
                      </div>

                      <div className={styles.metricCard}>
                        <div className={`${styles.metricIcon} ${styles.bgRose}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </div>
                        <div>
                          <div className={styles.metricValue}>{bulletin.attendanceSummary.absent}</div>
                          <div className={styles.metricLabel}>Ausencias</div>
                        </div>
                      </div>

                      <div className={styles.metricCard}>
                        <div className={`${styles.metricIcon} ${styles.bgAmber}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div>
                          <div className={styles.metricValue}>{bulletin.attendanceSummary.late}</div>
                          <div className={styles.metricLabel}>Tardanzas</div>
                        </div>
                      </div>

                      <div className={styles.metricCard}>
                        <div className={`${styles.metricIcon} ${styles.bgCyan}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
                        </div>
                        <div>
                          <div className={styles.metricValue}>{bulletin.attendanceSummary.justified}</div>
                          <div className={styles.metricLabel}>Justificadas</div>
                        </div>
                      </div>
                    </div>

                    {/* Absenteeism Chronology Logs */}
                    <div className={styles.historySection}>
                      <h3 className={styles.historyTitle}>Registro Histórico de Inasistencias</h3>
                      {getAbsenceLogs().length === 0 ? (
                        <div className={styles.emptyFeed} style={{ padding: '32px', backgroundColor: 'transparent' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
                          <p>Excelente: El estudiante no tiene inasistencias ni tardanzas cargadas.</p>
                        </div>
                      ) : (
                        <div className={styles.tableContainer}>
                          <table className={styles.logTable}>
                            <thead>
                              <tr>
                                <th>Fecha escolar</th>
                                <th>Novedad de Asistencia</th>
                                <th>Justificación adjunta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getAbsenceLogs().map((record) => {
                                let label = '';
                                let classText = '';
                                if (record.status === 'ABSENT') {
                                  label = 'Ausente';
                                  classText = styles.absent;
                                } else if (record.status === 'LATE') {
                                  label = 'Tardanza';
                                  classText = styles.late;
                                } else if (record.status === 'JUSTIFIED') {
                                  label = 'Justificado';
                                  classText = styles.justified;
                                }

                                return (
                                  <tr key={record.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                      {formatDate(record.date)}
                                    </td>
                                    <td>
                                      <span className={`${styles.statusText} ${classText}`}>
                                        {label}
                                      </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                      {record.justification || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin justificar</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. Communications Inbox */}
            {activeTab === 'comunicados' && (
              <div className={styles.panelCard}>
                <div className={styles.panelTitle}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Bandeja de Comunicados Oficiales</span>
                </div>

                {loadingComms ? (
                  <div className={styles.loadingContainer}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <p>Buscando comunicados institucionales...</p>
                  </div>
                ) : comms.length === 0 ? (
                  <div className={styles.emptyFeed}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>Bandeja vacía: No se recibieron comunicados dirigidos a tu familia o cursos.</p>
                  </div>
                ) : (
                  <div className={styles.commsFeed}>
                    {comms.map((comm) => (
                      <article key={comm.id} className={styles.commCard}>
                        <div className={styles.commHeader}>
                          
                          <div className={styles.authorMeta}>
                            <div className={styles.authorAvatar}>
                              {comm.author.name[0]}
                            </div>
                            <div>
                              <div className={styles.authorName}>
                                {comm.author.name} {comm.author.lastName}
                              </div>
                              <div className={styles.authorRole}>
                                {translateRole(comm.author.role)}
                              </div>
                            </div>
                          </div>

                          <div className={styles.commMetaRight}>
                            <span className={styles.commDate}>
                              {formatDateWithTime(comm.createdAt)}
                            </span>
                            {comm.targetCourse ? (
                              <span className={`${styles.commSegmentBadge} ${styles.badgeCourse}`}>
                                Curso: {comm.targetCourse.year}° &ldquo;{comm.targetCourse.division}&rdquo;
                              </span>
                            ) : (
                              <span className={`${styles.commSegmentBadge} ${styles.badgeGeneral}`}>
                                Comunicado General
                              </span>
                            )}
                          </div>

                        </div>

                        <div>
                          <h3 className={styles.commTitle}>{comm.title}</h3>
                          <p className={styles.commContent}>{comm.content}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
