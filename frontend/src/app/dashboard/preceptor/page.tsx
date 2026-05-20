'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from '../rolePage.module.css';

export default function PreceptorDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['PRECEPTOR']}>
      <div className={styles.roleContainer}>
        {/* Welcome */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal, {user?.name || 'Preceptor'}!</h1>
          <p>
            Como Preceptor, tu función abarca el control diario de asistencia escolar, seguimiento de la disciplina, comunicación directa con los tutores y supervisión de los cursos a tu cargo.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentAmber}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M3 20h4M5 20v-4" />
                <rect width="8" height="12" x="3" y="4" rx="2" />
                <path d="M7 8h.01M17 8h.01M17 12h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Control de Asistencia</h3>
            <p className={styles.cardDesc}>
              Registra el presentismo, las inasistencias y las tardanzas diarias de los alumnos pertenecientes a tus divisiones a cargo.
            </p>
            <div className={styles.cardAction}>
              <span>Tomar Asistencia</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentRose}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Novedades y Conducta</h3>
            <p className={styles.cardDesc}>
              Carga actas de disciplina, amonestaciones, felicitaciones y otras incidencias de conducta escolar en los legajos.
            </p>
            <div className={styles.cardAction}>
              <span>Registrar Novedad</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentIndigo}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Comunicados a Familias</h3>
            <p className={styles.cardDesc}>
              Envía notificaciones oficiales de citación, avisos grupales de curso o advertencias de inasistencias a los tutores.
            </p>
            <div className={styles.cardAction}>
              <span>Redactar Aviso</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>Acciones de Preceptoría</h2>
          <div className={styles.actionList}>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M3 20h4M5 20v-4"/><rect width="8" height="12" x="3" y="4" rx="2"/></svg>
              <span>Asistencia de Hoy</span>
            </div>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Ver Lista de Estudiantes</span>
            </div>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Enviar Citación</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
