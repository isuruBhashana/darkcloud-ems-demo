import { FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
    navigate('/login');
  };

  const displayName = session?.user?.name || 'Administrator';
  const displayEmail = session?.user?.email || 'System Admin';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ccfbf1',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiUser style={{ fontSize: '18px' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{displayEmail}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', backgroundColor: '#e5e7eb' }} />

        {/* Top Bar Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout Administrator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <FiLogOut style={{ fontSize: '16px' }} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
