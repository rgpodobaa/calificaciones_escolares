'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirigir a login si no está autenticado
        router.push('/login');
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirigir a su dashboard correspondiente si no tiene permisos para esta ruta
        const roleDashboard = `/dashboard/${user.role.toLowerCase()}`;
        router.push(roleDashboard);
      }
    }
  }, [isAuthenticated, loading, user, allowedRoles, router]);

  // Pantalla de carga mientras se verifica el token
  if (loading) {
    return (
      <div style={spinnerStyles.container}>
        <div style={spinnerStyles.spinner}></div>
        <p style={spinnerStyles.text}>Cargando portal escolar...</p>
      </div>
    );
  }

  // Si no está autenticado, no renderiza nada mientras redirige
  if (!isAuthenticated) {
    return null;
  }

  // Si el rol no está permitido, no renderiza nada mientras redirige
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// Estilos rápidos en línea para el spinner de carga para evitar dependencias
const spinnerStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    fontFamily: 'var(--font-main)',
  },
  spinner: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '4px solid var(--border-color)',
    borderTop: '4px solid var(--brand-primary)',
    animation: 'spin 1s linear infinite',
  },
  text: {
    marginTop: '20px',
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
};

// Insertar animación de spin de forma segura si no está en globals (aunque está implementado con keyframes, pongámoslo en globals o agreguemos inline-style)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
