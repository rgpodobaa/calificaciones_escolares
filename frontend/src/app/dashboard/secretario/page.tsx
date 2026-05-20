'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from '../rolePage.module.css';

export default function SecretarioDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['SECRETARIO']}>
      <div className={styles.roleContainer}>
        {/* Welcome */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal, {user?.name || 'Secretario'}!</h1>
          <p>
            Como Secretario/a, tu función principal es la gestión de matrículas, inscripción de alumnos, registro de documentación oficial y emisión de constancias académicas.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className={styles.grid}>
          <Link href="/dashboard/admin/students" className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`${styles.cardIcon} ${styles.accentCyan}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Inscripción de Alumnos</h3>
            <p className={styles.cardDesc}>
              Registra nuevos estudiantes en la base de datos de la institución académica y asígnales sus datos de contacto.
            </p>
            <div className={styles.cardAction}>
              <span>Inscribir Alumno</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          <Link href="/dashboard/admin/students" className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`${styles.cardIcon} ${styles.accentAmber}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Constancias y Boletines</h3>
            <p className={styles.cardDesc}>
              Emite constancias de alumno regular, certificados oficiales de estudio, analíticos parciales y libretas de calificaciones.
            </p>
            <div className={styles.cardAction}>
              <span>Generar Documentos</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          <Link href="/dashboard/admin/academic" className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`${styles.cardIcon} ${styles.accentIndigo}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Calendario de Exámenes</h3>
            <p className={styles.cardDesc}>
              Programa las fechas correspondientes a las comisiones evaluadoras de materias previas y equivalencias.
            </p>
            <div className={styles.cardAction}>
              <span>Ver Calendario</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>Acciones Administrativas</h2>
          <div className={styles.actionList}>
            <Link href="/dashboard/admin/students" className={styles.actionItem} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span>Generar Constancia</span>
            </Link>
            <Link href="/dashboard/admin/students" className={styles.actionItem} style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Asignar Alumno a Curso</span>
            </Link>
            <div className={styles.actionItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>Ayuda / Soporte</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
