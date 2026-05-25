'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/services/api';
import styles from './docente.module.css';

interface Subject {
  id: string;
  name: string;
  course: {
    id: string;
    year: number;
    division: string;
    shift: string;
  };
}

interface StudentGradeDetail {
  id?: string;
  concept: 'TEA' | 'TEP' | 'TED' | '' | null;
  numericValue: number | null;
  comments: string | null;
  updatedAt?: string;
}

interface StudentGradeRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  dni: string;
  grades: {
    PRE_INFORME_1: StudentGradeDetail | null;
    CUATRIMESTRE_1: StudentGradeDetail | null;
    PRE_INFORME_2: StudentGradeDetail | null;
    CUATRIMESTRE_2: StudentGradeDetail | null;
    FINAL: StudentGradeDetail | null;
  };
}

type PeriodType = 'PRE_INFORME_1' | 'CUATRIMESTRE_1' | 'PRE_INFORME_2' | 'CUATRIMESTRE_2' | 'FINAL';

// Structure to hold edited inputs in the UI
interface CellEditState {
  concept: 'TEA' | 'TEP' | 'TED' | '' | null;
  numericValue: string; // string so that we can type it easily
  comments: string;
  isDirty: boolean;
  saving: boolean;
}

export default function DocenteDashboard() {
  const { user } = useAuth();

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Students and local grid state
  const [students, setStudents] = useState<StudentGradeRecord[]>([]);
  const [gridData, setGridData] = useState<Record<string, CellEditState>>({}); // key: `${studentId}_${period}`
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [generalMessage, setGeneralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active cell comment modal state
  const [modalActive, setModalActive] = useState<boolean>(false);
  const [modalCell, setModalCell] = useState<{ studentId: string; studentName: string; period: PeriodType } | null>(null);
  const [modalCommentText, setModalCommentText] = useState<string>('');

  // 1. Initial Load: Fetch assigned subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await apiGet('/teacher/subjects');
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // 2. Fetch students and their grades upon subject select
  useEffect(() => {
    if (!selectedSubjectId) return;

    const fetchStudentsAndGrades = async () => {
      setLoadingStudents(true);
      setGeneralMessage(null);
      try {
        const response = await apiGet(`/teacher/subjects/${selectedSubjectId}/students`);
        // response structure: { subjectId, subjectName, course, students: [...] }
        const fetchedStudents: StudentGradeRecord[] = response.students;
        setStudents(fetchedStudents);

        // Build initial local grid data
        const initialGrid: Record<string, CellEditState> = {};
        fetchedStudents.forEach((student) => {
          const periods: PeriodType[] = ['PRE_INFORME_1', 'CUATRIMESTRE_1', 'PRE_INFORME_2', 'CUATRIMESTRE_2', 'FINAL'];
          periods.forEach((period) => {
            const dbGrade = student.grades[period];
            initialGrid[`${student.studentId}_${period}`] = {
              concept: dbGrade ? dbGrade.concept : '',
              numericValue: dbGrade && dbGrade.numericValue !== null ? String(dbGrade.numericValue) : '',
              comments: dbGrade && dbGrade.comments ? dbGrade.comments : '',
              isDirty: false,
              saving: false
            };
          });
        });
        setGridData(initialGrid);
      } catch (err: any) {
        console.error('Error fetching student grades:', err);
        setGeneralMessage({
          type: 'error',
          text: err.message || 'Error al cargar calificaciones de los alumnos.',
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedSubjectId]);

  // Autoselection rules: num (1-10) maps to TEA (7-10), TEP (4-6), TED (1-3)
  const getConceptFromNumeric = (numStr: string): 'TEA' | 'TEP' | 'TED' | '' => {
    const val = parseFloat(numStr);
    if (isNaN(val) || val < 1 || val > 10) return '';
    if (val >= 7) return 'TEA';
    if (val >= 4) return 'TEP';
    return 'TED';
  };

  // Handle changes to numeric inputs (Cuatrimestres and Final)
  const handleNumericChange = (studentId: string, period: PeriodType, value: string) => {
    const key = `${studentId}_${period}`;
    setGridData((prev) => {
      const cell = prev[key];
      let newConcept = cell.concept;

      // Rule: For cuatrimestre values, autoselect the concept
      if (period === 'CUATRIMESTRE_1' || period === 'CUATRIMESTRE_2') {
        newConcept = getConceptFromNumeric(value) || '';
      }

      return {
        ...prev,
        [key]: {
          ...cell,
          numericValue: value,
          concept: newConcept,
          isDirty: true,
        },
      };
    });
  };

  // Handle changes to conceptual dropdowns (Pre-informes and Cuatrimestres)
  const handleConceptChange = (studentId: string, period: PeriodType, value: 'TEA' | 'TEP' | 'TED' | '') => {
    const key = `${studentId}_${period}`;
    setGridData((prev) => {
      const cell = prev[key];
      return {
        ...prev,
        [key]: {
          ...cell,
          concept: value,
          isDirty: true,
        },
      };
    });
  };

  // Save changes of a specific cell to backend
  const handleSaveCell = async (studentId: string, period: PeriodType) => {
    const key = `${studentId}_${period}`;
    const cell = gridData[key];

    // Client-side validations
    let numericValue: number | null = null;
    let concept: string | null = cell.concept || null;

    if (period === 'PRE_INFORME_1' || period === 'PRE_INFORME_2') {
      if (!concept) {
        alert('Debes seleccionar un concepto (TEA, TEP o TED).');
        return;
      }
    }

    if (period === 'CUATRIMESTRE_1' || period === 'CUATRIMESTRE_2') {
      if (cell.numericValue === '') {
        alert('Debes ingresar una nota numérica para el cuatrimestre.');
        return;
      }
      const numVal = parseFloat(cell.numericValue);
      if (isNaN(numVal) || numVal < 1 || numVal > 10) {
        alert('La nota numérica debe estar entre 1 y 10.');
        return;
      }
      numericValue = numVal;

      // Autoselect check to block inconsistent states (redundancy check)
      const expectedConcept = getConceptFromNumeric(cell.numericValue);
      if (concept && concept !== expectedConcept) {
        alert(`Inconsistencia: La nota ${numVal} corresponde al concepto ${expectedConcept}, no puedes asignar ${concept}.`);
        return;
      }
      concept = expectedConcept;
    }

    if (period === 'FINAL') {
      if (cell.numericValue === '') {
        alert('Debes ingresar una nota final.');
        return;
      }
      const numVal = parseFloat(cell.numericValue);
      if (isNaN(numVal) || numVal < 1 || numVal > 10) {
        alert('La nota final debe estar entre 1 y 10.');
        return;
      }
      numericValue = numVal;
      concept = null; // final has no concept
    }

    // Set saving loading state
    setGridData((prev) => ({
      ...prev,
      [key]: { ...prev[key], saving: true },
    }));

    try {
      await apiPost('/teacher/grades', {
        studentId,
        subjectId: selectedSubjectId,
        period,
        concept,
        numericValue,
        comments: cell.comments || null,
      });

      // Clear dirty and saving flags on success
      setGridData((prev) => ({
        ...prev,
        [key]: { ...prev[key], isDirty: false, saving: false },
      }));

      setGeneralMessage({
        type: 'success',
        text: 'Nota registrada exitosamente en el servidor.',
      });
    } catch (err: any) {
      console.error('Error saving grade cell:', err);
      alert(err.message || 'Error al guardar la calificación.');
      setGridData((prev) => ({
        ...prev,
        [key]: { ...prev[key], saving: false },
      }));
    }
  };

  // Open the detailed comment modal
  const handleOpenCommentModal = (studentId: string, studentName: string, period: PeriodType) => {
    const cell = gridData[`${studentId}_${period}`];
    setModalCell({ studentId, studentName, period });
    setModalCommentText(cell ? cell.comments : '');
    setModalActive(true);
  };

  // Save the comment modal content back to local state and trigger save
  const handleSaveModalComment = () => {
    if (!modalCell) return;
    const { studentId, period } = modalCell;
    const key = `${studentId}_${period}`;

    setGridData((prev) => {
      const currentCell = prev[key];
      return {
        ...prev,
        [key]: {
          ...currentCell,
          comments: modalCommentText,
          isDirty: true,
        },
      };
    });

    setModalActive(false);
    // Automatically trigger cell save to commit comment as well
    setTimeout(() => {
      handleSaveCell(studentId, period);
    }, 100);
  };

  // Helpers to check period types
  const isConceptOnly = (p: PeriodType) => p === 'PRE_INFORME_1' || p === 'PRE_INFORME_2';
  const isNumericOnly = (p: PeriodType) => p === 'FINAL';
  const isBoth = (p: PeriodType) => p === 'CUATRIMESTRE_1' || p === 'CUATRIMESTRE_2';

  const getSubjectName = () => {
    const sub = subjects.find(s => s.id === selectedSubjectId);
    return sub ? `${sub.name} (${sub.course.year}° "${sub.course.division}")` : '';
  };

  return (
    <ProtectedRoute allowedRoles={['DOCENTE']}>
      <div className={styles.container}>
        {/* Welcome Header */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a, Prof. {user?.lastName || 'Docente'}</h1>
          <p>
            Carga y actualiza las calificaciones cuatrimestrales y pre-informes conceptuales de tus alumnos en las materias asignadas.
          </p>
        </div>

        {/* Dropdown Selector Card */}
        <div className={styles.selectorCard}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="subjectSelect">Materia / Curso asignado</label>
            <select
              id="subjectSelect"
              className={styles.select}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">Cargando materias...</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} - {sub.course.year}° &ldquo;{sub.course.division}&rdquo; ({sub.course.shift})
                  </option>
                ))
              )}
            </select>
          </div>

          {generalMessage && (
            <div className={`${styles.alertMessage} ${generalMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
              <span>{generalMessage.text}</span>
            </div>
          )}
        </div>

        {/* Main Grid Card */}
        <div className={styles.gridCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
              <span>Matriz de Calificaciones</span>
            </div>
            {selectedSubjectId && (
              <span className={styles.cardSubtitle}>
                {getSubjectName()}
              </span>
            )}
          </div>

          {loadingStudents ? (
            <div className={styles.emptyState}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <p>Cargando lista de alumnos y planilla de notas...</p>
            </div>
          ) : students.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>No se encontraron alumnos cursando en esta división.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.gradesTable}>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Pre-Informe 1</th>
                    <th>1º Cuatrimestre</th>
                    <th>Pre-Informe 2</th>
                    <th>2º Cuatrimestre</th>
                    <th>Nota Final</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.studentId}>
                      <td>
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>
                            {student.lastName}, {student.firstName}
                          </span>
                          <span className={styles.studentDni}>DNI: {student.dni}</span>
                        </div>
                      </td>

                      {/* Render cells for each period */}
                      {(['PRE_INFORME_1', 'CUATRIMESTRE_1', 'PRE_INFORME_2', 'CUATRIMESTRE_2', 'FINAL'] as PeriodType[]).map((period) => {
                        const cellKey = `${student.studentId}_${period}`;
                        const cell = gridData[cellKey] || { concept: '', numericValue: '', comments: '', isDirty: false, saving: false };
                        
                        // Pick styling class for the conceptual badge colors
                        let conceptClass = '';
                        if (cell.concept === 'TEA') conceptClass = styles.badgeTEA;
                        if (cell.concept === 'TEP') conceptClass = styles.badgeTEP;
                        if (cell.concept === 'TED') conceptClass = styles.badgeTED;

                        return (
                          <td key={period} className={`${styles.gradeCell} ${cell.isDirty ? styles.dirtyCell : ''}`}>
                            <div className={styles.cellContainer}>
                              <div className={styles.inputsRow}>
                                {/* Numeric Input */}
                                {(isNumericOnly(period) || isBoth(period)) && (
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    step="0.1"
                                    className={styles.numericInput}
                                    placeholder="-"
                                    value={cell.numericValue}
                                    disabled={cell.saving}
                                    onChange={(e) => handleNumericChange(student.studentId, period, e.target.value)}
                                  />
                                )}

                                {/* Conceptual Dropdown */}
                                {(isConceptOnly(period) || isBoth(period)) && (
                                  <select
                                    className={`${styles.conceptSelect} ${conceptClass}`}
                                    value={cell.concept || ''}
                                    disabled={cell.saving || (isBoth(period) && cell.numericValue !== '')} // disable concept selector if numeric is typed (autoselect holds)
                                    onChange={(e) => handleConceptChange(student.studentId, period, e.target.value as any)}
                                  >
                                    <option value="">--</option>
                                    <option value="TEA">TEA</option>
                                    <option value="TEP">TEP</option>
                                    <option value="TED">TED</option>
                                  </select>
                                )}
                              </div>

                              {/* Tiny Cell Actions */}
                              <div className={styles.cellControls}>
                                {/* Save Button */}
                                {cell.isDirty && (
                                  <button
                                    type="button"
                                    className={styles.miniSaveBtn}
                                    title="Guardar esta nota"
                                    disabled={cell.saving}
                                    onClick={() => handleSaveCell(student.studentId, period)}
                                  >
                                    {cell.saving ? (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    )}
                                  </button>
                                )}
                                
                                {/* Comment Trigger */}
                                <button
                                  type="button"
                                  className={`${styles.miniCommentBtn} ${cell.comments ? styles.hasComment : ''}`}
                                  title={cell.comments ? `Comentario: ${cell.comments}` : "Añadir comentario cualitativo"}
                                  onClick={() => handleOpenCommentModal(student.studentId, `${student.lastName}, ${student.firstName}`, period)}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Comment Dialog Modal */}
        {modalActive && modalCell && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h2>Devolución Pedagógica</h2>
                <button type="button" className={styles.closeBtn} onClick={() => setModalActive(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.studentDetailInfo}>
                  <div className={styles.studentDetailLabel}>Estudiante</div>
                  <div className={styles.studentDetailName}>{modalCell.studentName}</div>
                  <div className={styles.studentDetailLabel} style={{ marginTop: '8px' }}>Periodo</div>
                  <div className={styles.studentDetailName} style={{ fontSize: '0.9rem', color: 'var(--brand-primary)' }}>
                    {modalCell.period.replace('_', ' ')}
                  </div>
                </div>

                <div className={styles.formGroup} style={{ minWidth: 'auto' }}>
                  <label className={styles.label}>Comentario o Informe cualitativo</label>
                  <textarea
                    className={styles.modalTextarea}
                    placeholder="Escriba aquí sus comentarios pedagógicos sobre el desempeño del alumno en este período..."
                    value={modalCommentText}
                    onChange={(e) => setModalCommentText(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setModalActive(false)}>
                  Cancelar
                </button>
                <button type="button" className={styles.saveButton} onClick={handleSaveModalComment}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Guardar y Aplicar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
