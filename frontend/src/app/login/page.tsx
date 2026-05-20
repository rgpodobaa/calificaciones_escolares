'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user, error: authError, clearError } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado al cargar
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [isAuthenticated, user, router]);

  // Limpiar errores globales al montar
  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor, completa todos los campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      // Redirigir al dashboard específico del rol
      router.push(`/dashboard/${loggedUser.role.toLowerCase()}`);
    } catch (err: any) {
      // El error se maneja en el bloque catch o se lee del contexto
      setLocalError(err.message || 'Error al iniciar sesión.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      {/* Elementos decorativos de fondo */}
      <div className={styles.glowCircle1}></div>
      <div className={styles.glowCircle2}></div>

      <div className={styles.loginCard}>
        <div className={styles.cardHeader}>
          <div className={styles.logoContainer}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <h1>Portal Escolar</h1>
          <p>Plataforma de Calificaciones</p>
        </div>

        {/* Alertas de error */}
        {(localError || authError) && (
          <div className={styles.errorAlert}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{localError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="email">Correo Electrónico</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
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
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                className={styles.formInput}
                type="email"
                id="email"
                placeholder="ejemplo@colegio.edu.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="password">Contraseña</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
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
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                className={styles.formInput}
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className={styles.btnSpinner}></div>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Ingresar al Portal</span>
            )}
          </button>
        </form>

        {/* Datos Demo */}
        <div className={styles.demoHelper}>
          <p>Credenciales de Prueba (Directivo):</p>
          <div>Email: <code>admin@colegio.edu.ar</code></div>
          <div>Contraseña: <code>admin123</code></div>
        </div>
      </div>
    </div>
  );
}
