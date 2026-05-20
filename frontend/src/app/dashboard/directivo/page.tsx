'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from '../rolePage.module.css';

export default function DirectivoDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['DIRECTIVO']}>
      <div className={styles.roleContainer}>
        {/* Welcome */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal, {user?.name || 'Directivo'}!</h1>
          <p>
            Como Directivo, tienes acceso a la visión general de la institución, gestión de personal, cursos y configuraciones generales del establecimiento.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className={styles.grid}>
          <Link href="/dashboard/admin/academic" className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`${styles.cardIcon} ${styles.accentIndigo}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10M6 10h10" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Gestión de Cursos</h3>
            <p className={styles.cardDesc}>
              Supervisa las divisiones, turnos y materias asignadas a cada trayecto escolar de la institución.
            </p>
            <div className={styles.cardAction}>
              <span>Administrar Cursos</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          <Link href="/dashboard/admin/users" className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`${styles.cardIcon} ${styles.accentEmerald}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Personal Docente</h3>
            <p className={styles.cardDesc}>
              Administra las altas de docentes, cargos y asignaciones horarias a cada división escolar.
            </p>
            <div className={styles.cardAction}>
              <span>Administrar Docentes</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          <Link href="/dashboard/admin/students" className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`${styles.cardIcon} ${styles.accentCyan}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Estadísticas Académicas</h3>
            <p className={styles.cardDesc}>
              Analiza reportes de aprobación escolar, boletines y rendimientos generales de los alumnos por ciclo.
            </p>
            <div className={styles.cardAction}>
              <span>Ver Reportes</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>Acciones Directivas</h2>
          <div className={styles.actionList}>
            <Link href="/dashboard/admin/academic" className={styles.actionItem} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>Crear Nuevo Curso</span>
            </Link>
            <Link href="/dashboard/admin/academic" className={styles.actionItem} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Configurar Ciclo Lectivo</span>
            </Link>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Comunicado Institucional</span>
            </div>
            <Link href="/dashboard/admin/users" className={styles.actionItem} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Ajustes del Sistema</span>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
