import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/logo';
import { authClient } from '../lib/auth-client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || 'Invalid administrator credentials');
      } else {
        navigate('/');
      }
    } catch {
      setError('Unable to log in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <Logo height={68} alt="Project Darkcloud" />
          <h2
            style={{
              margin: '16px 0 4px 0',
              fontSize: '20px',
              fontWeight: '800',
              color: '#0d9488',
            }}
          >
            Employee Management System
          </h2>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#64748b' }}>
            Demo Project - Administrator Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div>
            <label
              htmlFor="admin-email"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@darkcloud.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.3)',
              marginTop: '8px',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          Project Darkcloud &copy; 2026
        </div>
      </div>
    </div>
  );
}
