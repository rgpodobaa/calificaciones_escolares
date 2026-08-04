import React, { useState, useEffect } from 'react';
import { apiGet } from '@/services/api';
import styles from './studentHistoryModal.module.css';

interface StudentHistoryModalProps {
  studentId: string;
  onClose: () => void;
}

export default function StudentHistoryModal({ studentId, onClose }: StudentHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'GRADES' | 'ATTENDANCE'>('GRADES');
  const [selectedYearKey, setSelectedYearKey] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet(`/students/${studentId}/boletin`);
        setData(res);
        
        // Seleccionar la primera llave de historia académica si existe
        if (res.academicHistory) {
          const keys = Object.keys(res.academicHistory);
          if (keys.length > 0) {
            setSelectedYearKey(keys[0]);
          }
        }
      } catch (err: any) {
        console.error('Error al obtener el historial académico:', err);
        setError(err.message || 'Error al obtener el historial académico del alumno.');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchHistory();
    }
  }, [studentId]);

  const renderBadge = (gradeObj: any) => {
    if (!gradeObj) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    const { concept, numericValue } = gradeObj;

    if (concept === 'TEA') {
      return <span className={styles.badgeTea}>TEA</span>;
    }
    if (concept === 'TEP') {
      return <span className={styles.badgeTep}>TEP</span>;
    }
    if (concept === 'TED') {
      return <span className={styles.badgeTed}>TED</span>;
    }
    if (numericValue !== null && numericValue !== undefined) {
      return <strong>{numericValue}</strong>;
    }
    return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!studentId) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>
              {data?.student ? `${data.student.firstName[0]}${data.student.lastName[0]}` : '📜'}
            </div>
            <div>
              <div className={styles.studentName}>
                {loading ? 'Cargando Estudiante...' : `${data?.student?.lastName}, ${data?.student?.firstName}`}
              </div>
              <div className={styles.studentMeta}>
                <span>DNI: <strong>{data?.student?.dni || '-'}</strong></span>
                {data?.currentCourse && (
                  <span>
                    Curso Actual: <strong>{data.currentCourse.year}° "{data.currentCourse.division}" ({data.currentCourse.shift})</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className={styles.closeButton} onClick={onClose} title="Cerrar modal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Cargando trayectoria e historial académico...</div>
            </div>
          ) : error ? (
            <div className={styles.emptyState} style={{ color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          ) : !data ? (
            <div className={styles.emptyState}>No se encontraron datos para este estudiante.</div>
          ) : (
            <>
              {/* Toolbar */}
              <div className={styles.controlsRow}>
                <div className={styles.tabGroup}>
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'GRADES' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('GRADES')}
                  >
                    Calificaciones y Sábana
                  </button>
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'ATTENDANCE' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('ATTENDANCE')}
                  >
                    Inasistencias y Asistencia
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {Object.keys(data.academicHistory || {}).length > 0 && (
                    <div className={styles.yearSelector}>
                      <span>Ciclo Lectivo:</span>
                      <select
                        className={styles.yearSelect}
                        value={selectedYearKey}
                        onChange={(e) => setSelectedYearKey(e.target.value)}
                      >
                        {Object.entries(data.academicHistory).map(([key, item]: [string, any]) => (
                          <option key={key} value={key}>
                            {item.schoolYear} - {item.course ? `${item.course.year}° "${item.course.division}"` : 'Sin Curso'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button className={styles.printBtn} onClick={handlePrint}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    <span>Imprimir Boletín</span>
                  </button>
                </div>
              </div>

              {/* Tab Content 1: GRADES */}
              {activeTab === 'GRADES' && (
                <div>
                  {selectedYearKey && data.academicHistory[selectedYearKey] ? (
                    <div>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Materia</th>
                              <th>Docente</th>
                              <th style={{ textAlign: 'center' }}>Pre-Informe 1</th>
                              <th style={{ textAlign: 'center' }}>1° Cuatrimestre</th>
                              <th style={{ textAlign: 'center' }}>Pre-Informe 2</th>
                              <th style={{ textAlign: 'center' }}>2° Cuatrimestre</th>
                              <th style={{ textAlign: 'center' }}>Nota Final</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.academicHistory[selectedYearKey].subjects.map((sub: any) => (
                              <tr key={sub.subjectId}>
                                <td>
                                  <strong>{sub.subjectName}</strong>
                                </td>
                                <td>
                                  {sub.teacher ? `${sub.teacher.lastName}, ${sub.teacher.name}` : <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                                </td>
                                <td style={{ textAlign: 'center' }}>{renderBadge(sub.grades.PRE_INFORME_1)}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderBadge(sub.grades.CUATRIMESTRE_1)}
                                  {sub.grades.CUATRIMESTRE_1?.comments && (
                                    <div className={styles.commentBlock}>"{sub.grades.CUATRIMESTRE_1.comments}"</div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>{renderBadge(sub.grades.PRE_INFORME_2)}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderBadge(sub.grades.CUATRIMESTRE_2)}
                                  {sub.grades.CUATRIMESTRE_2?.comments && (
                                    <div className={styles.commentBlock}>"{sub.grades.CUATRIMESTRE_2.comments}"</div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>{renderBadge(sub.grades.FINAL)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>No existen calificaciones registradas para este período.</div>
                  )}
                </div>
              )}

              {/* Tab Content 2: ATTENDANCE */}
              {activeTab === 'ATTENDANCE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Resumen */}
                  <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                      <div className={styles.statTitle}>Presentes</div>
                      <div className={styles.statVal} style={{ color: '#059669' }}>{data.attendanceSummary?.present || 0}</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statTitle}>Ausentes</div>
                      <div className={styles.statVal} style={{ color: '#dc2626' }}>{data.attendanceSummary?.absent || 0}</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statTitle}>Tardanzas</div>
                      <div className={styles.statVal} style={{ color: '#d97706' }}>{data.attendanceSummary?.late || 0}</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statTitle}>Justificadas</div>
                      <div className={styles.statVal} style={{ color: '#2563eb' }}>{data.attendanceSummary?.justified || 0}</div>
                    </div>
                  </div>

                  {/* Detalle de Inasistencias */}
                  {data.attendanceRecords && data.attendanceRecords.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Estado de Asistencia</th>
                            <th>Justificación / Observación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.attendanceRecords.map((rec: any) => (
                            <tr key={rec.id}>
                              <td><strong>{rec.date}</strong></td>
                              <td>
                                {rec.status === 'PRESENT' && <span className={styles.badgeTea}>PRESENTE</span>}
                                {rec.status === 'ABSENT' && <span className={styles.badgeTed}>AUSENTE</span>}
                                {rec.status === 'LATE' && <span className={styles.badgeTep}>TARDANZA</span>}
                                {rec.status === 'JUSTIFIED' && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>JUSTIFICADA</span>}
                              </td>
                              <td>{rec.justification || <span style={{ color: 'var(--text-muted)' }}>Sin observaciones</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>No existen registros de asistencias o faltas para este alumno.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
