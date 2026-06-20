'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiGet, apiPost } from '@/services/api';
import styles from './promote.module.css';

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
  courseId: string | null;
}

export default function PromoteStudentsABM() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [repeatingStudentIds, setRepeatingStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmModalActive, setConfirmModalActive] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch courses and students
  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [studentsData, coursesData] = await Promise.all([
        apiGet('/admin/students'),
        apiGet('/admin/courses')
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
      // Reset selections
      setRepeatingStudentIds([]);
    } catch (err: any) {
      console.error('Error loading promotion data:', err);
      setMessage({ type: 'error', text: err.message || 'Error al cargar los datos escolares.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group active students by course in memory
  const groupedStudents = useMemo(() => {
    const groups: Record<string, { courseName: string; students: Student[] }> = {};
    
    courses.forEach(c => {
      groups[c.id] = {
        courseName: `${c.year}° "${c.division}" (${c.shift})`,
        students: []
      };
    });

    students.forEach(s => {
      if (s.courseId && groups[s.courseId]) {
        groups[s.courseId].students.push(s);
      }
    });

    return Object.entries(groups)
      .map(([courseId, data]) => ({
        courseId,
        courseName: data.courseName,
        students: data.students
      }))
      .filter(g => g.students.length > 0);
  }, [students, courses]);

  // Total counts
  const totalStudentsCount = useMemo(() => {
    return students.filter(s => s.courseId !== null).length;
  }, [students]);

  const promotedCount = totalStudentsCount - repeatingStudentIds.length;

  const handleToggleRepeat = (studentId: string) => {
    setRepeatingStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Submit batch promotion request
  const handleConfirmPromotion = async () => {
    setConfirmModalActive(false);
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await apiPost('/admin/promote-students', {
        repeatingStudentIds
      });

      setMessage({
        type: 'success',
        text: `Proceso de cierre de ciclo lectivo finalizado. ${response.promotedCount} alumnos promovidos exitosamente.`
      });

      // Reload lists
      await loadData();
    } catch (err: any) {
      console.error('Error promoting students:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Error al procesar el cierre de ciclo lectivo.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['DIRECTIVO', 'SECRETARIO']}>
      <div className={styles.container}>
        {/* Page Title */}
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1>Cierre de Ciclo / Promoción de Alumnos</h1>
            <p>Finaliza el ciclo lectivo promoviendo a los alumnos aprobados o reteniendo a los repetidores.</p>
          </div>
        </div>

        {/* Info Box */}
        <div className={styles.infoBanner}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <strong>Instrucciones importantes:</strong> Al confirmar el Cierre de Ciclo, todos los alumnos con curso asignado serán promovidos automáticamente al siguiente año lectivo en su misma división y turno (ej: de 1° A a 2° A). Los alumnos que no tengan un curso posterior configurado se graduarán (quedarán sin curso). Los alumnos que marques como <strong>repetidores</strong> mantendrán su curso actual de forma permanente.
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`${styles.alertMessage} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {message.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingBox}>
            <p>Cargando listado de alumnos por división...</p>
          </div>
        ) : groupedStudents.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron alumnos activos con cursos asignados para promover.</p>
          </div>
        ) : (
          <>
            {/* Floating Actions Statistics Bar */}
            <div className={styles.actionsBar}>
              <div className={styles.barStats}>
                Alumnos en total: <strong>{totalStudentsCount}</strong> | Promueven: <strong>{promotedCount}</strong> | Repiten: <strong>{repeatingStudentIds.length}</strong>
              </div>
              <button
                type="button"
                className={styles.confirmBtn}
                disabled={submitting}
                onClick={() => setConfirmModalActive(true)}
              >
                {submitting ? 'Procesando...' : 'Confirmar Cierre de Ciclo'}
              </button>
            </div>

            {/* Courses and Students list grid */}
            <div className={styles.coursesGrid}>
              {groupedStudents.map(group => (
                <div key={group.courseId} className={styles.courseCard}>
                  <div className={styles.courseHeader}>
                    <span className={styles.courseTitle}>Curso: {group.courseName}</span>
                    <span className={styles.studentCountBadge}>{group.students.length} alumnos</span>
                  </div>

                  <div className={styles.studentList}>
                    {group.students.map(student => {
                      const isRepeating = repeatingStudentIds.includes(student.id);

                      return (
                        <div
                          key={student.id}
                          className={`${styles.studentRow} ${isRepeating ? styles.repeatingRow : ''}`}
                        >
                          <div className={styles.studentNameCol}>
                            <input
                              type="checkbox"
                              className={styles.studentCheckbox}
                              checked={isRepeating}
                              onChange={() => handleToggleRepeat(student.id)}
                            />
                            <div>
                              <div className={styles.studentName}>
                                {student.lastName}, {student.firstName}
                              </div>
                              <div className={styles.studentDni}>DNI: {student.dni}</div>
                            </div>
                          </div>

                          <span className={`${styles.outcomeBadge} ${isRepeating ? styles.badgeRepeats : styles.badgePromotes}`}>
                            {isRepeating ? 'Repite' : 'Promueve'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Safety Confirm Modal Dialog */}
        {confirmModalActive && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <div className={styles.modalBody}>
                <div className={styles.modalIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3>¿Confirmar Cierre del Ciclo Lectivo?</h3>
                <p>
                  Estás a punto de procesar la promoción académica anual. Esta acción modificará las asignaciones de cursos de <strong>{totalStudentsCount} alumnos</strong>:
                  <br />
                  <br />
                  - <strong>{promotedCount} alumnos</strong> serán promovidos al siguiente curso.
                  <br />
                  - <strong>{repeatingStudentIds.length} alumnos</strong> repetirán y mantendrán su curso.
                  <br />
                  <br />
                  <strong>Esta acción es masiva y no puede deshacerse de forma directa.</strong> ¿Deseas continuar?
                </p>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setConfirmModalActive(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.confirmSaveButton}
                  onClick={handleConfirmPromotion}
                >
                  Confirmar y Procesar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
