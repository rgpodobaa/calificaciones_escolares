'use client';

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className={styles.dashboardContainer}>
        {/* Navigation Bar */}
        <header className={styles.header}>
          <Link 
            href={user ? `/dashboard/${user.role.toLowerCase()}` : '/dashboard'} 
            className={styles.headerBrand}
            style={{ textDecoration: 'none' }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
            <span className={styles.brandTitle}>Classment</span>
          </Link>

          <div className={styles.headerUser}>
            {user && (
              <>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>
                    {user.name} {user.lastName}
                  </span>
                  <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
                    {user.role}
                  </span>
                </div>
                
                <button className={styles.logoutButton} onClick={logout} title="Cerrar sesión">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Salir</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
