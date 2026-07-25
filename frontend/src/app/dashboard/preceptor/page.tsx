'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/services/api';
import styles from './preceptor.module.css';

interface PreceptorCourse {
  id: string;
  year: number;
  division: string;
  shift: string;
}

interface AttendanceRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  dni: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED';
  justification: string;
}

export default function PreceptorDashboard() {
  const { user } = useAuth();
  
  // Helper to get local date in YYYY-MM-DD format
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<'asistencia' | 'comunicados'>('asistencia');

  // Preceptor Courses and Selectors
  const [courses, setCourses] = useState<PreceptorCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  
  // Attendance state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Communications Form state
  const [commTitle, setCommTitle] = useState<string>('');
  const [commContent, setCommContent] = useState<string>('');
  const [commTargetCourseId, setCommTargetCourseId] = useState<string>('');
  const [sendingComm, setSendingComm] = useState<boolean>(false);
  const [commMessage, setCommMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Aggregate Attendance Counters
  const attendanceStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let justified = 0;
    records.forEach((r) => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'LATE') late++;
      else if (r.status === 'JUSTIFIED') justified++;
    });
    return { present, absent, late, justified, total: records.length };
  }, [records]);

  // Bulk operation to mark all loaded records as present
  const handleMarkAllPresent = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'PRESENT' })));
  };

  // Initial Load: Fetch assigned courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiGet('/preceptor/courses');
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching preceptor courses:', err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch Attendance when Selected Course or Date changes
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) return;

    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      setAttendanceMessage(null);
      try {
        const response = await apiGet(`/preceptor/courses/${selectedCourseId}/attendance?date=${selectedDate}`);
        
        // Response format: { date: "...", courseId: "...", records: [...] }
        // where records: [{ studentId, firstName, lastName, DNI, attendance: { id, status, justification } | null }]
        const mappedRecords = response.records.map((r: any) => ({
          studentId: r.studentId,
          firstName: r.firstName,
          lastName: r.lastName,
          dni: r.dni,
          status: r.attendance ? r.attendance.status : 'PRESENT', // default to PRESENT if not logged yet
          justification: r.attendance && r.attendance.justification ? r.attendance.justification : '',
        }));

        setRecords(mappedRecords);
      } catch (err: any) {
        console.error('Error fetching attendance:', err);
        setAttendanceMessage({
          type: 'error',
          text: err.message || 'Error al cargar la asistencia para la fecha seleccionada.',
        });
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendance();
  }, [selectedCourseId, selectedDate]);

  // Update a single student status in the frontend state
  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED') => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId === studentId) {
          // If we change status from justified, clear justification or keep it. Let's keep it but it's optional.
          return { ...r, status };
        }
        return r;
      })
    );
  };

  // Update a single student justification in the frontend state
  const handleJustificationChange = (studentId: string, justification: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, justification } : r))
    );
  };

  // Submit batch attendance records
  const handleSaveAttendance = async () => {
    if (!selectedCourseId || !selectedDate) return;
    setSavingAttendance(true);
    setAttendanceMessage(null);

    const payload = {
      date: selectedDate,
      records: records.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        justification: r.status === 'JUSTIFIED' || r.justification ? r.justification : null,
      })),
    };

    try {
      await apiPost('/preceptor/attendance', payload);
      setAttendanceMessage({
        type: 'success',
        text: 'Asistencia guardada y sincronizada exitosamente.',
      });
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setAttendanceMessage({
        type: 'error',
        text: err.message || 'Error al guardar el registro de asistencia.',
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Submit Communication
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
        text: 'Comunicado emitido y publicado con éxito.',
      });
      // Clear form
      setCommTitle('');
      setCommContent('');
      setCommTargetCourseId('');
    } catch (err: any) {
      console.error('Error sending communication:', err);
      setCommMessage({
        type: 'error',
        text: err.message || 'Error al enviar el comunicado escolar.',
      });
    } finally {
      setSendingComm(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['PRECEPTOR']}>
      <div className={styles.container}>
        {/* Welcome Header */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a, {user?.name || 'Preceptor'}</h1>
          <p>
            Gestiona la asistencia diaria de tus divisiones asignadas y emite avisos oficiales directamente a los estudiantes.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'asistencia' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('asistencia')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Control de Asistencia</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'comunicados' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('comunicados')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Comunicados Oficiales</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className={styles.tabContent}>
          
          {/* TAB 1: Attendance Management */}
          {activeTab === 'asistencia' && (
            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9M3 20h4M5 20v-4" />
                  <rect width="8" height="12" x="3" y="4" rx="2" />
                  <path d="M7 8h.01M17 8h.01M17 12h.01M17 16h.01" />
                </svg>
                <span>Planilla de Asistencia Diaria</span>
              </div>

              {/* Selector inputs */}
              <div className={styles.selectorRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="courseSelect">Curso / División</label>
                  <select
                    id="courseSelect"
                    className={styles.select}
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    {courses.length === 0 ? (
                      <option value="">Cargando cursos...</option>
                    ) : (
                      courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.year}° &ldquo;{course.division}&rdquo; - Turno {course.shift}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="attendanceDate">Fecha escolar</label>
                  <input
                    id="attendanceDate"
                    type="date"
                    className={styles.input}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Attendance feedback messages */}
              {attendanceMessage && (
                <div className={`${styles.alertMessage} ${attendanceMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                  {attendanceMessage.type === 'success' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  )}
                  <span>{attendanceMessage.text}</span>
                </div>
              )}

              {/* Real-time stats bar & bulk action */}
              {records.length > 0 && !loadingAttendance && (
                <div className={styles.statsAndActionsBar}>
                  <div className={styles.liveStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Total</span>
                      <span className={styles.statVal}>{attendanceStats.total}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.statPresent}`}>
                      <span className={styles.statLabel}>Presentes</span>
                      <span className={styles.statVal}>{attendanceStats.present}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.statAbsent}`}>
                      <span className={styles.statLabel}>Ausentes</span>
                      <span className={styles.statVal}>{attendanceStats.absent}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.statLate}`}>
                      <span className={styles.statLabel}>Tardanzas</span>
                      <span className={styles.statVal}>{attendanceStats.late}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.statJustified}`}>
                      <span className={styles.statLabel}>Justificados</span>
                      <span className={styles.statVal}>{attendanceStats.justified}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.bulkActionBtn}
                    onClick={handleMarkAllPresent}
                    title="Marcar a todos los alumnos como Presentes"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Marcar todos Presentes</span>
                  </button>
                </div>
              )}

              {/* Students Table */}
              {loadingAttendance ? (
                <div className={styles.emptyState}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <p>Cargando lista de alumnos y registros de asistencia...</p>
                </div>
              ) : records.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p>No se encontraron alumnos registrados en este curso.</p>
                </div>
              ) : (
                <>
                  <div className={styles.tableContainer}>
                    <table className={styles.attendanceTable}>
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Estado de Asistencia</th>
                          <th>Justificativo / Motivo (Opcional)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={record.studentId}>
                            <td>
                              <div className={styles.studentName}>
                                {record.lastName}, {record.firstName}
                              </div>
                              <div className={styles.studentDni}>DNI: {record.dni}</div>
                            </td>
                            <td>
                              <div className={styles.statusButtonGroup}>
                                <button
                                  type="button"
                                  className={`${styles.statusButton} ${styles.btnPresent} ${record.status === 'PRESENT' ? styles.active : ''}`}
                                  onClick={() => handleStatusChange(record.studentId, 'PRESENT')}
                                >
                                  Pres.
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.statusButton} ${styles.btnAbsent} ${record.status === 'ABSENT' ? styles.active : ''}`}
                                  onClick={() => handleStatusChange(record.studentId, 'ABSENT')}
                                >
                                  Aus.
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.statusButton} ${styles.btnLate} ${record.status === 'LATE' ? styles.active : ''}`}
                                  onClick={() => handleStatusChange(record.studentId, 'LATE')}
                                >
                                  Tard.
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.statusButton} ${styles.btnJustified} ${record.status === 'JUSTIFIED' ? styles.active : ''}`}
                                  onClick={() => handleStatusChange(record.studentId, 'JUSTIFIED')}
                                >
                                  Just.
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.justificationInput}
                                placeholder={record.status === 'JUSTIFIED' ? "Motivo obligatorio..." : "Agregar motivo..."}
                                value={record.justification}
                                onChange={(e) => handleJustificationChange(record.studentId, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={handleSaveAttendance}
                      disabled={savingAttendance}
                    >
                      {savingAttendance ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          <span>Guardar Asistencia</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Communications dispatcher */}
          {activeTab === 'comunicados' && (
            <div className={styles.panelCard}>
              <div className={styles.panelTitle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Emitir Comunicado Escolar</span>
              </div>

              <form onSubmit={handleSendCommunication} className="flex flex-col gap-5">
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

                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                  <label className={styles.label} htmlFor="commTitle">Título del Comunicado</label>
                  <input
                    id="commTitle"
                    type="text"
                    className={styles.input}
                    placeholder="Ej: Reunión Urgente de Padres"
                    value={commTitle}
                    onChange={(e) => setCommTitle(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                  <label className={styles.label} htmlFor="commCourse">Segmentación de Curso (Opcional)</label>
                  <select
                    id="commCourse"
                    className={styles.select}
                    value={commTargetCourseId}
                    onChange={(e) => setCommTargetCourseId(e.target.value)}
                  >
                    <option value="">General (Toda la institución)</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        Solo a {course.year}° &ldquo;{course.division}&rdquo;
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
                  <label className={styles.label} htmlFor="commContent">Contenido del Aviso</label>
                  <textarea
                    id="commContent"
                    className={styles.textarea}
                    placeholder="Redacte detalladamente el comunicado para las familias..."
                    value={commContent}
                    onChange={(e) => setCommContent(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitCommunicationBtn}
                  disabled={sendingComm}
                >
                  {sendingComm ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      <span>Publicando comunicado...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      <span>Enviar Comunicado</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
