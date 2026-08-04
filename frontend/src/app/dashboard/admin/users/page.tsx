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
  const [showInactive, setShowInactive] = useState<boolean>(true);

  // Estados de Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  
  // Selección actual para Editar / Eliminar / Resetear clave
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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
      setUsers(data || []);
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

  // Abrir modal para Resetear Clave
  const handleOpenResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetMessage(null);
    setShowResetPasswordModal(true);
  };

  // Abrir modal para Eliminar
  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Toggle directo Activo/Inactivo
  const handleToggleStatus = async (user: User) => {
    try {
      await apiPut(`/admin/users/${user.id}`, {
        active: !user.active
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar el estado del usuario.');
    }
  };

  // Generar contraseña aleatoria limpia
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let generated = '';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setNewPassword(generated);
  };

  // Enviar Formulario (Crear o Editar)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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
        const payload: any = {
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          dni: formData.dni,
          role: formData.role,
          active: formData.active
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await apiPut(`/admin/users/${selectedUser.id}`, payload);
      } else {
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

  // Confirmar cambio de contraseña rápido
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword.trim()) return;
    setFormLoading(true);
    try {
      await apiPut(`/admin/users/${selectedUser.id}`, {
        password: newPassword
      });
      setResetMessage(`¡Contraseña de ${selectedUser.name} actualizada con éxito!`);
      setTimeout(() => {
        setShowResetPasswordModal(false);
        setResetMessage(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar la contraseña.');
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

  // Filtrar usuarios por búsqueda
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
      {/* Encabezado Principal */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>Gestión de Personal</h1>
          <p>Directivos, Secretarios, Preceptores y Docentes de la institución.</p>
        </div>

        <button className={styles.createButton} onClick={handleOpenCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className={styles.controlsCard}>
        <div className={styles.filtersGroup}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Chips de Selección Rápida por Rol */}
          <div className={styles.roleTabs}>
            <button
              type="button"
              className={`${styles.roleChip} ${roleFilter === '' ? styles.activeChip : ''}`}
              onClick={() => setRoleFilter('')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`${styles.roleChip} ${roleFilter === 'DIRECTIVO' ? styles.activeChip : ''}`}
              onClick={() => setRoleFilter('DIRECTIVO')}
            >
              Directivos
            </button>
            <button
              type="button"
              className={`${styles.roleChip} ${roleFilter === 'SECRETARIO' ? styles.activeChip : ''}`}
              onClick={() => setRoleFilter('SECRETARIO')}
            >
              Secretarios
            </button>
            <button
              type="button"
              className={`${styles.roleChip} ${roleFilter === 'PRECEPTOR' ? styles.activeChip : ''}`}
              onClick={() => setRoleFilter('PRECEPTOR')}
            >
              Preceptores
            </button>
            <button
              type="button"
              className={`${styles.roleChip} ${roleFilter === 'DOCENTE' ? styles.activeChip : ''}`}
              onClick={() => setRoleFilter('DOCENTE')}
            >
              Docentes
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Tabla Minimalista Limpia */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Cargando datos del personal...</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron usuarios registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre y Apellido</th>
                <th>DNI</th>
                <th>Email de Acceso</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.lastName}, {u.name}</strong></td>
                  <td>{u.dni}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      backgroundColor: u.role === 'DIRECTIVO' ? 'rgba(99, 102, 241, 0.1)' :
                                       u.role === 'DOCENTE' ? 'rgba(16, 185, 129, 0.1)' :
                                       u.role === 'SECRETARIO' ? 'rgba(6, 182, 212, 0.1)' :
                                       u.role === 'PRECEPTOR' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      color: u.role === 'DIRECTIVO' ? 'var(--brand-primary)' :
                             u.role === 'DOCENTE' ? 'var(--accent-emerald)' :
                             u.role === 'SECRETARIO' ? 'var(--accent-cyan)' :
                             u.role === 'PRECEPTOR' ? 'var(--accent-amber)' : 'var(--accent-rose)',
                      border: '1px solid currentColor'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u)}
                      className={`${styles.statusToggle} ${u.active ? styles.statusActive : styles.statusInactive}`}
                      title="Haz clic para alternar estado"
                    >
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'currentColor'
                      }}></span>
                      <span>{u.active ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className={`${styles.iconBtn} ${styles.editBtn}`}
                        onClick={() => handleOpenEdit(u)}
                        title="Editar datos"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button 
                        className={`${styles.iconBtn} ${styles.keyBtn}`}
                        onClick={() => handleOpenResetPassword(u)}
                        title="Restablecer contraseña"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </button>
                      <button 
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => handleOpenDelete(u)}
                        title="Eliminar usuario"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

      {/* Modal de Crear / Editar Usuario */}
      {showFormModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{selectedUser ? 'Editar Datos del Usuario' : 'Nuevo Usuario'}</h2>
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
                    placeholder="Ej: Juan"
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
                    placeholder="Ej: Pérez"
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
                    placeholder="Ej: 35123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    required
                    placeholder="ejemplo@escuela.edu.ar"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Rol Asignado *</label>
                  <select
                    className={styles.formSelect}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="DOCENTE">Docente</option>
                    <option value="PRECEPTOR">Preceptor</option>
                    <option value="SECRETARIO">Secretario</option>
                    <option value="DIRECTIVO">Directivo</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>
                      Contraseña {selectedUser ? '(dejar en blanco para no modificar)' : '*'}
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brand-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Generar Clave
                    </button>
                  </div>
                  <input
                    className={styles.formInput}
                    type="text"
                    required={!selectedUser}
                    placeholder={selectedUser ? 'Sin cambios' : 'Contraseña de acceso'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

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

      {/* Modal de Restablecer Contraseña */}
      {showResetPasswordModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <h2>Restablecer Contraseña</h2>
              <button className={styles.closeBtn} onClick={() => setShowResetPasswordModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit} className={styles.modalForm}>
              {resetMessage && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
                  {resetMessage}
                </div>
              )}
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Ingrese la nueva contraseña de acceso para <strong>{selectedUser.name} {selectedUser.lastName}</strong>:
              </p>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.formLabel}>Nueva Contraseña</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Generar Clave Aleatoria
                  </button>
                </div>
                <input
                  className={styles.formInput}
                  type="text"
                  required
                  placeholder="Ingrese nueva clave..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={formLoading || !newPassword}
                >
                  {formLoading ? 'Actualizando...' : 'Cambiar Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Baja */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.deleteDialog}`}>
            <div className={styles.deleteBody}>
              <div className={styles.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h3>¿Eliminar Usuario?</h3>
              <p>
                ¿Confirmas la eliminación definitiva del usuario <strong>{selectedUser.name} {selectedUser.lastName}</strong> ({selectedUser.role})?
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
    </div>
  );
}
