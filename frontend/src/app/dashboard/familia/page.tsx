'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from '../rolePage.module.css';

export default function FamiliaDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['FAMILIA']}>
      <div className={styles.roleContainer}>
        {/* Welcome */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal, {user?.name || 'Familia'}!</h1>
          <p>
            Como Familia/Tutor, tienes la posibilidad de realizar un seguimiento activo y en tiempo real del progreso académico de tus hijos a cargo, ver boletines, asistencias y comunicados de la institución.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentRose}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Boletín Académico</h3>
            <p className={styles.cardDesc}>
              Consulta los pre-informes cualitativos y las calificaciones finales por materia correspondientes al cuatrimestre en curso.
            </p>
            <div className={styles.cardAction}>
              <span>Ver Calificaciones</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentAmber}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Reporte de Asistencia</h3>
            <p className={styles.cardDesc}>
              Revisa el historial acumulado de faltas de tus hijos, faltas justificadas y porcentajes de asistencia por materia.
            </p>
            <div className={styles.cardAction}>
              <span>Ver Asistencia</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentIndigo}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Cuaderno de Comunicados</h3>
            <p className={styles.cardDesc}>
              Lee los anuncios enviados por los docentes, preceptores o la dirección escolar sobre reuniones de padres o novedades del colegio.
            </p>
            <div className={styles.cardAction}>
              <span>Ver Comunicados</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>Canal de Comunicación</h2>
          <div className={styles.actionList}>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Enviar Mensaje a Preceptor</span>
            </div>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Justificar Inasistencia</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
