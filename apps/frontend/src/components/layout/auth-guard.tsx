import type React from 'react';
import { Navigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>EMS Portal</div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            Checking administrator session...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
