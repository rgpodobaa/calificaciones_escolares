'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import StudentHistoryModal from '@/components/StudentHistoryModal';
import styles from '../abm.module.css';

interface Course {
  id: string;
  year: number;
  division: string;
  shift: string;
}

interface Family {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string | null;
  courseId: string | null;
  userId: string | null;
  course: Course | null;
  user: Family | null;
  active: boolean;
}

export default function StudentsABM() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  
  // Selección actual
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    birthDate: '',
    courseId: '',
    userId: '',
    createAccount: true,
    email: '',
    password: '',
    active: true
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentQuery = showInactive ? '?includeInactive=true' : '';
      const [studentsData, coursesData] = await Promise.all([
        apiGet(`/admin/students${studentQuery}`),
        apiGet('/admin/courses')
      ]);

      setStudents(studentsData || []);
      setCourses(coursesData || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los alumnos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showInactive]);

  // Abrir modal para Crear
  const handleOpenCreate = () => {
    setSelectedStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      dni: '',
      birthDate: '',
      courseId: courses[0]?.id || '',
      userId: '',
      createAccount: true,
      email: '',
      password: '',
      active: true
    });
    setFormError(null);
    setShowFormModal(true);
  };

  // Abrir modal para Editar
  const handleOpenEdit = (student: Student) => {
    let formattedDate = '';
    if (student.birthDate) {
      formattedDate = new Date(student.birthDate).toISOString().split('T')[0];
    }

    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      dni: student.dni,
      birthDate: formattedDate,
      courseId: student.courseId || '',
      userId: student.userId || '',
      createAccount: false,
      email: student.user?.email || '',
      password: '',
      active: student.active
    });
    setFormError(null);
    setShowFormModal(true);
  };

  // Generar clave segura rápida
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let generated = '';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
  };

  // Toggle directo Activo/Inactivo
  const handleToggleStatus = async (student: Student) => {
    try {
      await apiPut(`/admin/students/${student.id}`, {
        active: !student.active
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado de la matrícula.');
    }
  };

  // Abrir confirmación de borrado
  const handleOpenDelete = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Enviar formulario (Crear o Editar)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dni.trim()) {
      setFormError('Por favor completa los campos obligatorios (Nombre, Apellido, DNI).');
      return;
    }

    setFormLoading(true);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dni: formData.dni,
        birthDate: formData.birthDate || null,
        courseId: formData.courseId || null,
        userId: formData.userId || null,
        active: formData.active
      };

      if (!selectedStudent && formData.createAccount) {
        payload.createAccount = true;
        payload.email = formData.email.trim() || undefined;
        payload.password = formData.password.trim() || undefined;
      }

      if (selectedStudent) {
        await apiPut(`/admin/students/${selectedStudent.id}`, payload);
      } else {
        await apiPost('/admin/students', payload);
      }

      setShowFormModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el alumno.');
    } finally {
      setFormLoading(false);
    }
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await apiDelete(`/admin/students/${selectedStudent.id}`);
      setShowDeleteModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el alumno.');
      setLoading(false);
    }
  };

  // Filtrado de alumnos en memoria
  const filteredStudents = students.filter((s) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      s.firstName.toLowerCase().includes(searchLower) ||
      s.lastName.toLowerCase().includes(searchLower) ||
      s.dni.includes(searchQuery);
    
    const matchesCourse = courseFilter ? s.courseId === courseFilter : true;

    return matchesSearch && matchesCourse;
  });

  return (
    <div className={styles.container}>
      {/* Encabezado Principal */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>Gestión de Alumnos y Matriculación</h1>
          <p>Inscripción de estudiantes, asignación a cursos y legajos académicos.</p>
        </div>

        <button className={styles.createButton} onClick={handleOpenCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Inscribir Alumno</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className={styles.controlsCard}>
        <div className={styles.filtersGroup}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Chips de Selección Rápida por Curso */}
          <div className={styles.roleTabs}>
            <button
              type="button"
              className={`${styles.roleChip} ${courseFilter === '' ? styles.activeChip : ''}`}
              onClick={() => setCourseFilter('')}
            >
              Todos los Cursos
            </button>
            {courses.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.roleChip} ${courseFilter === c.id ? styles.activeChip : ''}`}
                onClick={() => setCourseFilter(c.id)}
              >
                {c.year}° &ldquo;{c.division}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.formAlert}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Tabla Minimalista Limpia (Sin columna Fecha de Nacimiento) */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Cargando lista de estudiantes...</div>
        ) : filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron alumnos registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>DNI</th>
                <th>Curso Asignado</th>
                <th>Cuenta de Acceso</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.lastName}, {s.firstName}</strong></td>
                  <td>{s.dni}</td>
                  <td>
                    {s.course ? (
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--brand-light)',
                        color: 'var(--brand-primary)',
                        border: '1px solid rgba(37, 99, 235, 0.2)'
                      }}>
                        {s.course.year}° &ldquo;{s.course.division}&rdquo; ({s.course.shift})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin asignar</span>
                    )}
                  </td>
                  <td>
                    {s.user ? (
                      <span style={{ fontSize: '0.88rem' }}>{s.user.email}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin vincular</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s)}
                      className={`${styles.statusToggle} ${s.active ? styles.statusActive : styles.statusInactive}`}
                      title="Haz clic para alternar estado de matrícula"
                    >
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'currentColor'
                      }}></span>
                      <span>{s.active ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className={styles.iconBtn} 
                        onClick={() => setHistoryStudentId(s.id)} 
                        title="Ver Legajo e Historial Académico"
                        style={{ color: 'var(--brand-primary)', backgroundColor: 'var(--brand-light)', borderColor: 'rgba(37, 99, 235, 0.2)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h6"/></svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => handleOpenEdit(s)} title="Editar datos">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleOpenDelete(s)} title="Eliminar estudiante">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Inscripción / Edición (Incluye Fecha de Nacimiento) */}
      {showFormModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{selectedStudent ? 'Editar Datos del Alumno' : 'Inscribir Nuevo Alumno'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowFormModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
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
                  <label className={styles.formLabel}>Nombre *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    required
                    placeholder="Ej: Mateo"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Apellido *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    required
                    placeholder="Ej: Gómez"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>DNI *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    required
                    placeholder="Ej: 48123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Fecha de Nacimiento</label>
                  <input
                    className={styles.formInput}
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Curso Asignado</label>
                <select
                  className={styles.formSelect}
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                >
                  <option value="">Sin Asignar (Pendiente)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.year}° &ldquo;{c.division}&rdquo; - Turno {c.shift}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedStudent && (
                <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
                  <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.createAccount}
                      onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span style={{ fontWeight: 600 }}>Crear cuenta de usuario para el portal</span>
                  </label>

                  {formData.createAccount && (
                    <div className={styles.formGrid} style={{ marginTop: '12px' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email de Acceso</label>
                        <input
                          className={styles.formInput}
                          type="email"
                          placeholder="alumno@escuela.edu.ar"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className={styles.formLabel}>Contraseña</label>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Generar Clave
                          </button>
                        </div>
                        <input
                          className={styles.formInput}
                          type="text"
                          placeholder="Clave inicial"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowFormModal(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={formLoading}
                >
                  {formLoading ? 'Guardando...' : 'Guardar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Borrado */}
      {showDeleteModal && selectedStudent && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.deleteDialog}`}>
            <div className={styles.deleteBody}>
              <div className={styles.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h3>¿Dar de Baja Alumno?</h3>
              <p>
                ¿Confirmas la eliminación del registro de <strong>{selectedStudent.lastName}, {selectedStudent.firstName}</strong> (DNI: {selectedStudent.dni})?
              </p>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton} 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteConfirm}
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Legajo / Historial Académico */}
      {historyStudentId && (
        <StudentHistoryModal
          studentId={historyStudentId}
          onClose={() => setHistoryStudentId(null)}
        />
      )}
    </div>
  );
}
