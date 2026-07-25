'use client';

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import styles from '../abm.module.css';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  lastName: string;
  dni: string;
  active: boolean;
}

export default function UsersABM() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);

  // Estados de Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selección actual para Editar / Eliminar
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    dni: '',
    role: 'DOCENTE',
    active: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Cargar usuarios
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = [];
      if (roleFilter) queryParams.push(`role=${roleFilter}`);
      if (showInactive) queryParams.push(`includeInactive=true`);
      const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await apiGet(`/admin/users${query}`);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, showInactive]);

  // Abrir modal para Crear
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      lastName: '',
      email: '',
      password: '',
      dni: '',
      role: 'DOCENTE',
      active: true
    });
    setFormError(null);
    setShowFormModal(true);
  };

  // Abrir modal para Editar
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      password: '', // En blanco por defecto
      dni: user.dni,
      role: user.role,
      active: user.active
    });
    setFormError(null);
    setShowFormModal(true);
  };

  // Abrir modal para Eliminar
  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Enviar Formulario (Crear o Editar)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validar campos
    if (!formData.name.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.dni.trim()) {
      setFormError('Por favor, completa todos los campos requeridos.');
      return;
    }

    if (!selectedUser && !formData.password) {
      setFormError('La contraseña es obligatoria al crear un usuario.');
      return;
    }

    setFormLoading(true);

    try {
      if (selectedUser) {
        // Editar
        const payload: any = {
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          dni: formData.dni,
          role: formData.role,
          active: formData.active
        };
        // Si ingresó contraseña nueva, mandarla
        if (formData.password) {
          payload.password = formData.password;
        }

        await apiPut(`/admin/users/${selectedUser.id}`, payload);
      } else {
        // Crear
        await apiPost('/admin/users', formData);
      }

      setShowFormModal(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el usuario.');
    } finally {
      setFormLoading(false);
    }
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await apiDelete(`/admin/users/${selectedUser.id}`);
      setShowDeleteModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el usuario.');
      setLoading(false);
    }
  };

  // Filtrar usuarios locales por búsqueda (Nombre, Apellido, DNI, Email)
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.dni.includes(searchQuery)
    );
  });

  return (
    <div className={styles.container}>
      {/* Page Title */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>Gestión del Personal y Usuarios</h1>
          <p>Administra las cuentas del personal de la institución (Directivos, Secretarios, Preceptores y Docentes).</p>
        </div>
      </div>

      {/* Filter / Control Bar */}
      <div className={styles.controlsCard}>
        <div className={styles.filtersGroup}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los Roles</option>
            <option value="DIRECTIVO">Directivos</option>
            <option value="SECRETARIO">Secretarios</option>
            <option value="PRECEPTOR">Preceptores</option>
            <option value="DOCENTE">Docentes</option>
            <option value="ALUMNO">Alumnos</option>
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
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Main Table */}
      {error && (
        <div className={styles.formAlert}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron usuarios registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre y Apellido</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.lastName}, {user.name}</strong></td>
                  <td>{user.dni}</td>
                  <td>{user.email}</td>
                  <td>
                    {/* Reutilizamos el estilo del badge en globals y layouts */}
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      backgroundColor: user.role === 'DIRECTIVO' ? 'rgba(99, 102, 241, 0.1)' :
                                       user.role === 'DOCENTE' ? 'rgba(16, 185, 129, 0.1)' :
                                       user.role === 'SECRETARIO' ? 'rgba(6, 182, 212, 0.1)' :
                                       user.role === 'PRECEPTOR' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      color: user.role === 'DIRECTIVO' ? 'var(--brand-primary)' :
                             user.role === 'DOCENTE' ? 'var(--accent-emerald)' :
                             user.role === 'SECRETARIO' ? 'var(--accent-cyan)' :
                             user.role === 'PRECEPTOR' ? 'var(--accent-amber)' : 'var(--accent-rose)',
                      border: '1px solid currentColor'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      backgroundColor: user.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                      color: user.active ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      border: '1px solid currentColor'
                    }}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button 
                        className={`${styles.iconBtn} ${styles.editBtn}`}
                        onClick={() => handleOpenEdit(user)}
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button 
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => handleOpenDelete(user)}
                        title="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Creation / Editing Modal */}
      {showFormModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowFormModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className={styles.modalForm}>
              {formError && (
                <div className={styles.formAlert}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
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
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Rol *</label>
                  <select
                    className={styles.formSelect}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="DIRECTIVO">Directivo</option>
                    <option value="SECRETARIO">Secretario</option>
                    <option value="PRECEPTOR">Preceptor</option>
                    <option value="DOCENTE">Docente</option>
                  </select>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    💡 <em>Para matricular estudiantes y crear sus accesos al portal, utiliza la sección dedicada <strong>Alumnos</strong>.</em>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Contraseña {selectedUser ? '(dejar en blanco para no cambiar)' : '*'}
                  </label>
                  <input
                    className={styles.formInput}
                    type="password"
                    required={!selectedUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {selectedUser && (
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Estado de la Cuenta (Activa / Habilitada)</span>
                  </label>
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
                  {formLoading ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} styles.deleteDialog`}>
            <div className={styles.deleteBody}>
              <div className={styles.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3>¿Dar de Baja Usuario?</h3>
              <p>
                ¿Estás seguro de que deseas dar de baja al usuario <strong>{selectedUser.name} {selectedUser.lastName}</strong> ({selectedUser.role})?<br />
                Esta acción inhabilitará su acceso a la plataforma (estado Inactivo) y podrá ser revertida editando su cuenta.
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
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
