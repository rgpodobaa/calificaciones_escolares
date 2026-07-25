'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
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
  const [studentUsers, setStudentUsers] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Estados de Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
      const [studentsData, coursesData, usersData] = await Promise.all([
        apiGet(`/admin/students${studentQuery}`),
        apiGet('/admin/courses'),
        apiGet('/admin/users?role=ALUMNO')
      ]);

      setStudents(studentsData);
      setCourses(coursesData);
      setStudentUsers(usersData);
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
      email: '',
      password: '',
      active: student.active
    });
    setFormError(null);
    setShowFormModal(true);
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
      setFormError('Por favor completa todos los campos requeridos (Nombre, Apellido, DNI).');
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

  // Filtrado de alumnos en memoria (búsqueda y filtro por curso)
  const filteredStudents = students.filter((s) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      s.firstName.toLowerCase().includes(searchLower) ||
      s.lastName.toLowerCase().includes(searchLower) ||
      s.dni.includes(searchQuery);
    
    const matchesCourse = courseFilter ? s.courseId === courseFilter : true;

    return matchesSearch && matchesCourse;
  });

  // Utilidad para formatear fechas legibles
  const formatBirthDate = (dateStr: string | null) => {
    if (!dateStr) return 'No registrada';
    const date = new Date(dateStr);
    // Ajustar zona horaria local
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      {/* Page Title */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>Gestión de Alumnos</h1>
          <p>Realiza la inscripción de estudiantes, asignación a cursos académicos y vinculación con sus tutores.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className={styles.controlsCard}>
        <div className={styles.filtersGroup}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="">Todos los Cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.year}° "{c.division}" ({c.shift})
              </option>
            ))}
          </select>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
            />
            <span>Mostrar inactivos</span>
          </label>
        </div>
        
        <button className={styles.createButton} onClick={handleOpenCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Inscribir Alumno</span>
        </button>
      </div>

      {error && (
        <div className={styles.formAlert}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Cargando alumnos...</div>
        ) : filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron alumnos registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Estudiante (DNI)</th>
                <th>Fecha Nacimiento</th>
                <th>Curso</th>
                <th>Cuenta de Alumno (Usuario)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.lastName}, {student.firstName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DNI: {student.dni}</div>
                  </td>
                  <td>{formatBirthDate(student.birthDate)}</td>
                  <td>
                    {student.course ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--brand-light)',
                        color: 'var(--brand-primary)'
                      }}>
                        {student.course.year}° "{student.course.division}" ({student.course.shift})
                      </span>
                    ) : (
                      <em style={{ color: 'var(--text-muted)' }}>Sin asignar</em>
                    )}
                  </td>
                  <td>
                    {student.user ? (
                      <div>
                        <div>{student.user.lastName}, {student.user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.user.email}</div>
                      </div>
                    ) : (
                      <em style={{ color: 'var(--text-muted)' }}>Sin vincular</em>
                    )}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      backgroundColor: student.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                      color: student.active ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      border: '1px solid currentColor'
                    }}>
                      {student.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => handleOpenEdit(student)} title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleOpenDelete(student)} title="Eliminar">
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

      {/* Form Modal */}
      {showFormModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{selectedStudent ? 'Editar Alumno' : 'Inscribir Alumno'}</h2>
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

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Curso Asignado</label>
                  <select
                    className={styles.formSelect}
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  >
                    <option value="">-- Sin curso --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.year}° "{c.division}" ({c.shift})
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedStudent ? (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cuenta de Alumno (Usuario)</label>
                    <select
                      className={styles.formSelect}
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    >
                      <option value="">-- Sin cuenta asignada --</option>
                      {studentUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.lastName}, {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.createAccount}
                        onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>Crear cuenta de acceso al portal</span>
                    </label>
                  </div>
                )}
              </div>

              {!selectedStudent && formData.createAccount && (
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    🔑 Credenciales de Acceso al Portal
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Correo Electrónico (Email)</label>
                      <input
                        className={styles.formInput}
                        type="email"
                        placeholder={formData.dni ? `${formData.dni}@alumno.colegio.edu.ar` : 'ejemplo@colegio.edu.ar'}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Contraseña Inicial</label>
                      <input
                        className={styles.formInput}
                        type="text"
                        placeholder={formData.dni ? `Por defecto: DNI (${formData.dni})` : 'Por defecto: DNI'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedStudent && (
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Alumno Activo (Habilitado en el ciclo)</span>
                  </label>
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowFormModal(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton} disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Inscribir Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} styles.deleteDialog`}>
            <div className={styles.deleteBody}>
              <div className={styles.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3>¿Dar de Baja Alumno?</h3>
              <p>
                ¿Estás seguro de que deseas dar de baja al estudiante <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>?<br />
                Su registro pasará al estado <strong>Inactivo</strong>, interrumpiendo su participación activa en el curso, y podrá reactivarse desde su edición.
              </p>
            </div>
            
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.confirmDeleteBtn} onClick={handleDeleteConfirm}>
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
