'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/services/api';
import styles from './directivo.module.css';

interface Course {
  id: string;
  year: number;
  division: string;
  shift: string;
}

export default function DirectivoDashboard() {
  const { user } = useAuth();

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Communication form state
  const [commTitle, setCommTitle] = useState<string>('');
  const [commContent, setCommContent] = useState<string>('');
  const [commTargetCourseId, setCommTargetCourseId] = useState<string>('');
  const [sendingComm, setSendingComm] = useState<boolean>(false);
  const [commMessage, setCommMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all courses in the institution (for Directivos, getCourses returns all courses)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await apiGet('/preceptor/courses');
        setCourses(data);
      } catch (err: any) {
        console.error('Error loading courses for directivo:', err);
      }
    };
    fetchCourses();
  }, []);

  // Submit communication notice
  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle || !commContent) {
      setCommMessage({ type: 'error', text: 'El título y el contenido son obligatorios.' });
      return;
    }

    setSendingComm(true);
    setCommMessage(null);

    const payload = {
      title: commTitle,
      content: commContent,
      targetCourseId: commTargetCourseId || null,
    };

    try {
      await apiPost('/communications', payload);
      setCommMessage({
        type: 'success',
        text: 'Comunicado emitido y publicado con éxito para la comunidad escolar.',
      });
      // Reset form
      setCommTitle('');
      setCommContent('');
      setCommTargetCourseId('');
    } catch (err: any) {
      console.error('Error sending directivo communication:', err);
      setCommMessage({
        type: 'error',
        text: err.message || 'Error al emitir el comunicado.',
      });
    } finally {
      setSendingComm(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['DIRECTIVO']}>
      <div className={styles.container}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <h1>Bienvenido/a al Portal, {user?.name || 'Directivo'}!</h1>
          <p>
            Como Directivo, tu portal está simplificado para que gestiones las credenciales de usuarios del sistema y emitas avisos escolares oficiales.
          </p>
        </div>

        {/* Dashboard Grid containing ABM shortcut & Communication form */}
        <div className={styles.dashboardGrid}>
          
          {/* Option 1: Users ABM Card */}
          <div className={styles.panelCard}>
            <Link href="/dashboard/admin/users" className={styles.cardLink}>
              <div className={styles.cardIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.cardTitle}>Administración de Usuarios (ABM)</h3>
              <p className={styles.cardDesc}>
                Alta, edición y eliminación de directivos, secretarios, preceptores, docentes y familias del establecimiento educativo.
              </p>
              <div className={styles.cardAction}>
                <span>Ingresar al ABM de Usuarios</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          </div>

          {/* Option 2: Communications dispatcher (same as preceptor, but with access to all courses) */}
          <div className={styles.panelCard}>
            <h3 className={styles.cardTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand-primary)', marginRight: '4px' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Emitir Comunicado Institucional
            </h3>

            <form onSubmit={handleSendCommunication} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {commMessage && (
                <div className={`${styles.alertMessage} ${commMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                  {commMessage.type === 'success' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  )}
                  <span>{commMessage.text}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="commTitle">Título del Aviso</label>
                <input
                  id="commTitle"
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Suspensión de clases por desinfección"
                  value={commTitle}
                  onChange={(e) => setCommTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="commCourse">Segmentación (Curso objetivo)</label>
                <select
                  id="commCourse"
                  className={styles.select}
                  value={commTargetCourseId}
                  onChange={(e) => setCommTargetCourseId(e.target.value)}
                >
                  <option value="">General (Toda la institución)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      Solo a {course.year}° &ldquo;{course.division}&rdquo; ({course.shift})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="commContent">Contenido del Comunicado</label>
                <textarea
                  id="commContent"
                  className={styles.textarea}
                  placeholder="Redacte aquí el comunicado oficial que recibirán los cursos y/o familias..."
                  value={commContent}
                  onChange={(e) => setCommContent(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={sendingComm}
              >
                {sendingComm ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <span>Enviando aviso...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    <span>Enviar Comunicado</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
