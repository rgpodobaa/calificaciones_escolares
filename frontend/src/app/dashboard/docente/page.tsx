'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from '../rolePage.module.css';

export default function DocenteDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['DOCENTE']}>
      <div className={styles.roleContainer}>
        {/* Welcome */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal, Prof. {user?.lastName || 'Docente'}!</h1>
          <p>
            Como Docente, puedes realizar la carga y edición de calificaciones académicas (pre-informes, cuatrimestrales y notas finales), programar exámenes y enviar devoluciones pedagógicas personalizadas.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentEmerald}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M3 20h4M5 20v-4" />
                <rect width="8" height="12" x="3" y="4" rx="2" />
                <path d="M12 5h8M12 9h8M12 13h8" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Carga de Notas</h3>
            <p className={styles.cardDesc}>
              Ingresa los conceptos (TEA, TEP, TED) o valores numéricos finales correspondientes a cada periodo académico en tus materias asignadas.
            </p>
            <div className={styles.cardAction}>
              <span>Subir Calificaciones</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentIndigo}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Planificación y Evaluaciones</h3>
            <p className={styles.cardDesc}>
              Programa fechas de exámenes escritos, entrega de trabajos prácticos o exposiciones orales para mantener al día el calendario del curso.
            </p>
            <div className={styles.cardAction}>
              <span>Planificar Evaluaciones</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.accentAmber}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Devoluciones Pedagógicas</h3>
            <p className={styles.cardDesc}>
              Redacta comentarios cualitativos individuales o informes de desempeño para guiar y motivar el aprendizaje de los alumnos.
            </p>
            <div className={styles.cardAction}>
              <span>Redactar Devolución</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>Acciones Docentes</h2>
          <div className={styles.actionList}>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>Nueva Calificación</span>
            </div>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Programar Fecha de Examen</span>
            </div>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span>Mis Alumnos por Curso</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
