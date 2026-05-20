'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        router.push(`/dashboard/${user.role.toLowerCase()}`);
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  return (
    <div style={containerStyles}>
      <div style={spinnerStyles}></div>
    </div>
  );
}

const containerStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: 'var(--bg-primary)',
};

const spinnerStyles = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: '3px solid var(--border-color)',
  borderTop: '3px solid var(--brand-primary)',
  animation: 'spin 1s linear infinite',
};
