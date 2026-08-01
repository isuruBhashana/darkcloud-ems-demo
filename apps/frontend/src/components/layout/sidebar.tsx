import type React from 'react';
import { useEffect, useState } from 'react';
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiHome,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { authClient } from '../../lib/auth-client';
import { Logo } from '../logo';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
}

function NavItem({ icon: Icon, label, to, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '10px',
        fontWeight: isActive ? '700' : '500',
        color: isActive ? '#0d9488' : '#4b5563',
        backgroundColor: isActive ? '#f0fdf4' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon style={{ fontSize: '20px', color: isActive ? '#0d9488' : '#6b7280' }} />
      <span style={{ fontSize: '14px' }}>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { data: session } = authClient.useSession();
  const [userPermissions, setUserPermissions] = useState<string[]>(['all']);

  useEffect(() => {
    async function checkPermissions() {
      if (session?.user?.email) {
        try {
          const res = await api.get('/admin-users');
          const currentUser = res.data.find(
            (u: { email: string }) => u.email === session.user.email,
          );
          if (currentUser?.permissionsList) {
            setUserPermissions(currentUser.permissionsList);
          }
        } catch {
          // Fallback to all
        }
      }
    }
    checkPermissions();
  }, [session?.user?.email]);

  const allNavItems = [
    { section: 'dashboard', label: 'Dashboard', to: '/', icon: FiHome },
    { section: 'employees', label: 'Employees', to: '/employees', icon: FiUsers },
    { section: 'departments', label: 'Departments', to: '/departments', icon: FiBriefcase },
    { section: 'attendance', label: 'Attendance', to: '/attendance', icon: FiClock },
    { section: 'leave', label: 'Leave Requests', to: '/leave', icon: FiCalendar },
    { section: 'reports', label: 'Reports', to: '/reports', icon: FiBarChart2 },
    { section: 'settings', label: 'Settings', to: '/settings', icon: FiSettings },
  ];

  const allowedNavItems = allNavItems.filter((item) => {
    if (item.section === 'dashboard') return true;
    if (userPermissions.includes('all')) return true;
    return userPermissions.includes(item.section);
  });

  return (
    <aside
      style={{
        width: '270px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      {/* Centered Brand Header with Larger Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingBottom: '20px',
          borderBottom: '1px solid #f3f4f6',
          marginBottom: '20px',
        }}
      >
        <Logo height={56} alt="Project Darkcloud" />
        <div
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#0d9488',
            marginTop: '10px',
            letterSpacing: '-0.2px',
          }}
        >
          Employee Management System
        </div>
        <div style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', marginTop: '2px' }}>
          Demo Project
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {allowedNavItems.map((item) => (
          <NavItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            isActive={
              item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            }
          />
        ))}
      </nav>
    </aside>
  );
}
