'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from './adminLayout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isLinkActive = (path: string) => {
    return pathname.startsWith(path) ? styles.activeLink : '';
  };

  return (
    <ProtectedRoute allowedRoles={['DIRECTIVO', 'SECRETARIO']}>
      <div className={styles.adminWorkspace}>
        {/* Admin Navigation Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Administración</div>
          
          <Link 
            href="/dashboard/admin/users" 
            className={`${styles.sidebarLink} ${isLinkActive('/dashboard/admin/users')}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Usuarios (ABM)</span>
          </Link>

          <Link 
            href="/dashboard/admin/students" 
            className={`${styles.sidebarLink} ${isLinkActive('/dashboard/admin/students')}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <circle cx="12" cy="10" r="2" />
              <path d="M10 14h4" />
            </svg>
            <span>Alumnos (ABM)</span>
          </Link>

          <Link 
            href="/dashboard/admin/academic" 
            className={`${styles.sidebarLink} ${isLinkActive('/dashboard/admin/academic')}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span>Cursos y Materias</span>
          </Link>

          {/* Volver al Panel de Inicio según el Rol */}
          <Link 
            href={user ? `/dashboard/${user.role.toLowerCase()}` : '/dashboard'} 
            className={styles.sidebarBackBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Volver al Inicio</span>
          </Link>
        </aside>

        {/* Content Panel */}
        <section className={styles.contentArea}>
          {children}
        </section>
      </div>
    </ProtectedRoute>
  );
}

