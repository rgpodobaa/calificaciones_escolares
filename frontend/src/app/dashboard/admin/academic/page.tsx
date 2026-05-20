'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import styles from '../abm.module.css';

interface Preceptor {
  id: string;
  name: string;
  lastName: string;
}

interface Course {
  id: string;
  year: number;
  division: string;
  shift: 'MANANA' | 'TARDE' | 'VESPERTINO';
  preceptorId: string | null;
  preceptor: Preceptor | null;
}

interface Teacher {
  id: string;
  name: string;
  lastName: string;
}

interface Subject {
  id: string;
  name: string;
  courseId: string;
  course: {
    id: string;
    year: number;
    division: string;
    shift: string;
  };
  teacherId: string | null;
  teacher: Teacher | null;
}

export default function AcademicABM() {
  const [activeTab, setActiveTab] = useState<'COURSES' | 'SUBJECTS'>('COURSES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos del backend
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [preceptors, setPreceptors] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Estados de Modales
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selección actual
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deleteType, setDeleteType] = useState<'COURSE' | 'SUBJECT' | null>(null);

  // Formulario Curso
  const [courseForm, setCourseForm] = useState({
    year: 1,
    division: 'A',
    shift: 'MANANA' as 'MANANA' | 'TARDE' | 'VESPERTINO',
    preceptorId: ''
  });

  // Formulario Materia
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    courseId: '',
    teacherId: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Cargar todos los datos
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, subjectsData, preceptorsData, teachersData] = await Promise.all([
        apiGet('/admin/courses'),
        apiGet('/admin/subjects'),
        apiGet('/admin/users?role=PRECEPTOR'),
        apiGet('/admin/users?role=DOCENTE'),
      ]);
      
      setCourses(coursesData);
      setSubjects(subjectsData);
      setPreceptors(preceptorsData);
      setTeachers(teachersData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos académicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Modales Curso
  const handleOpenCourseCreate = () => {
    setSelectedCourse(null);
    setCourseForm({
      year: 1,
      division: 'A',
      shift: 'MANANA',
      preceptorId: preceptors[0]?.id || ''
    });
    setFormError(null);
    setShowCourseModal(true);
  };

  const handleOpenCourseEdit = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      year: course.year,
      division: course.division,
      shift: course.shift,
      preceptorId: course.preceptorId || ''
    });
    setFormError(null);
    setShowCourseModal(true);
  };

  // Modales Materia
  const handleOpenSubjectCreate = () => {
    setSelectedSubject(null);
    setSubjectForm({
      name: '',
      courseId: courses[0]?.id || '',
      teacherId: teachers[0]?.id || ''
    });
    setFormError(null);
    setShowSubjectModal(true);
  };

  const handleOpenSubjectEdit = (subj: Subject) => {
    setSelectedSubject(subj);
    setSubjectForm({
      name: subj.name,
      courseId: subj.courseId,
      teacherId: subj.teacherId || ''
    });
    setFormError(null);
    setShowSubjectModal(true);
  };

  // Abrir eliminación
  const handleOpenDelete = (item: any, type: 'COURSE' | 'SUBJECT') => {
    setDeleteType(type);
    if (type === 'COURSE') {
      setSelectedCourse(item);
      setSelectedSubject(null);
    } else {
      setSelectedSubject(item);
      setSelectedCourse(null);
    }
    setShowDeleteModal(true);
  };

  // Enviar Curso
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!courseForm.year || !courseForm.division.trim() || !courseForm.shift) {
      setFormError('Por favor completa todos los campos.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        year: Number(courseForm.year),
        division: courseForm.division,
        shift: courseForm.shift,
        preceptorId: courseForm.preceptorId || null
      };

      if (selectedCourse) {
        await apiPut(`/admin/courses/${selectedCourse.id}`, payload);
      } else {
        await apiPost('/admin/courses', payload);
      }

      setShowCourseModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el curso.');
    } finally {
      setFormLoading(false);
    }
  };

  // Enviar Materia
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subjectForm.name.trim() || !subjectForm.courseId) {
      setFormError('Por favor completa los campos obligatorios (Nombre y Curso).');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: subjectForm.name,
        courseId: subjectForm.courseId,
        teacherId: subjectForm.teacherId || null
      };

      if (selectedSubject) {
        await apiPut(`/admin/subjects/${selectedSubject.id}`, payload);
      } else {
        await apiPost('/admin/subjects', payload);
      }

      setShowSubjectModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la materia.');
    } finally {
      setFormLoading(false);
    }
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      if (deleteType === 'COURSE' && selectedCourse) {
        await apiDelete(`/admin/courses/${selectedCourse.id}`);
      } else if (deleteType === 'SUBJECT' && selectedSubject) {
        await apiDelete(`/admin/subjects/${selectedSubject.id}`);
      }
      setShowDeleteModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el elemento.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Title */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>Gestión Escolar</h1>
          <p>Administra los trayectos académicos mediante la creación de Cursos y Materias curriculares.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'COURSES' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('COURSES')}
        >
          Cursos
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'SUBJECTS' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('SUBJECTS')}
        >
          Materias / Asignaturas
        </button>
      </div>

      {/* Control Bar */}
      <div className={styles.controlsCard}>
        <div className={styles.filtersGroup}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {activeTab === 'COURSES' ? `${courses.length} Cursos definidos` : `${subjects.length} Materias definidas`}
          </span>
        </div>
        
        {activeTab === 'COURSES' ? (
          <button className={styles.createButton} onClick={handleOpenCourseCreate}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nuevo Curso</span>
          </button>
        ) : (
          <button className={styles.createButton} onClick={handleOpenSubjectCreate} disabled={courses.length === 0}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nueva Materia</span>
          </button>
        )}
      </div>

      {error && (
        <div className={styles.formAlert}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Tables depending on active tab */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Cargando datos...</div>
        ) : activeTab === 'COURSES' ? (
          /* Courses Table */
          courses.length === 0 ? (
            <div className={styles.emptyState}>No hay cursos creados. Comienza haciendo clic en 'Nuevo Curso'.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Año</th>
                  <th>División</th>
                  <th>Turno</th>
                  <th>Preceptor Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td><strong>{course.year}° Año</strong></td>
                    <td>"{course.division}"</td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>{course.shift}</span>
                    </td>
                    <td>
                      {course.preceptor ? `${course.preceptor.lastName}, ${course.preceptor.name}` : <em style={{ color: 'var(--text-muted)' }}>Sin asignar</em>}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => handleOpenCourseEdit(course)} title="Editar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleOpenDelete(course, 'COURSE')} title="Eliminar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          /* Subjects Table */
          subjects.length === 0 ? (
            <div className={styles.emptyState}>No hay materias creadas. Comienza haciendo clic en 'Nueva Materia'.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre de Materia</th>
                  <th>Curso</th>
                  <th>Docente Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj) => (
                  <tr key={subj.id}>
                    <td><strong>{subj.name}</strong></td>
                    <td>{subj.course ? `${subj.course.year}° "${subj.course.division}" (${subj.course.shift})` : 'Sin Curso'}</td>
                    <td>
                      {subj.teacher ? `${subj.teacher.lastName}, ${subj.teacher.name}` : <em style={{ color: 'var(--text-muted)' }}>Sin asignar</em>}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => handleOpenSubjectEdit(subj)} title="Editar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleOpenDelete(subj, 'SUBJECT')} title="Eliminar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{selectedCourse ? 'Editar Curso' : 'Nuevo Curso'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowCourseModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleCourseSubmit} className={styles.modalForm}>
              {formError && (
                <div className={styles.formAlert}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Año (Nivel) *</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={courseForm.year}
                    onChange={(e) => setCourseForm({ ...courseForm, year: Number(e.target.value) })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>División (Ej: A, B, C) *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    maxLength={2}
                    required
                    value={courseForm.division}
                    onChange={(e) => setCourseForm({ ...courseForm, division: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Turno *</label>
                  <select
                    className={styles.formSelect}
                    value={courseForm.shift}
                    onChange={(e) => setCourseForm({ ...courseForm, shift: e.target.value as any })}
                  >
                    <option value="MANANA">Mañana</option>
                    <option value="TARDE">Tarde</option>
                    <option value="VESPERTINO">Vespertino</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Preceptor Asignado</label>
                  <select
                    className={styles.formSelect}
                    value={courseForm.preceptorId}
                    onChange={(e) => setCourseForm({ ...courseForm, preceptorId: e.target.value })}
                  >
                    <option value="">-- Sin preceptor --</option>
                    {preceptors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.lastName}, {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowCourseModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton} disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{selectedSubject ? 'Editar Materia' : 'Nueva Materia'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowSubjectModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubjectSubmit} className={styles.modalForm}>
              {formError && (
                <div className={styles.formAlert}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre de la Materia *</label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Ej: Matemática, Biología"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Curso Correspondiente *</label>
                  <select
                    className={styles.formSelect}
                    value={subjectForm.courseId}
                    onChange={(e) => setSubjectForm({ ...subjectForm, courseId: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecciona un Curso</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.year}° "{c.division}" ({c.shift})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Docente Asignado</label>
                  <select
                    className={styles.formSelect}
                    value={subjectForm.teacherId}
                    onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                  >
                    <option value="">-- Sin docente --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.lastName}, {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowSubjectModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton} disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar Materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} styles.deleteDialog`}>
            <div className={styles.deleteBody}>
              <div className={styles.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3>¿Eliminar {deleteType === 'COURSE' ? 'Curso' : 'Materia'}?</h3>
              <p>
                {deleteType === 'COURSE' && selectedCourse && (
                  <>
                    ¿Estás seguro de que deseas eliminar el curso <strong>{selectedCourse.year}° "{selectedCourse.division}" ({selectedCourse.shift})</strong>?<br />
                    Esto podría desvincular a todos los alumnos e inhabilitar las materias asociadas a este curso.
                  </>
                )}
                {deleteType === 'SUBJECT' && selectedSubject && (
                  <>
                    ¿Estás seguro de que deseas eliminar la materia <strong>{selectedSubject.name}</strong>?<br />
                    Esto borrará permanentemente todas las notas cargadas asociadas a esta asignatura.
                  </>
                )}
              </p>
            </div>
            
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmDeleteBtn} onClick={handleDeleteConfirm}>
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
