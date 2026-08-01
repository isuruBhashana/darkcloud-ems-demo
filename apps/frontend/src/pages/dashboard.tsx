import { useEffect, useState } from 'react';
import { FiBriefcase, FiCalendar, FiCheckCircle, FiUsers } from 'react-icons/fi';
import { MainLayout } from '../components/layout/main-layout';
import { api } from '../lib/api';

interface Stats {
  totalEmployees: number;
  totalDepartments: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingLeaves: number;
  attendanceToday: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
  };
  recentEmployees: Array<{
    id: string;
    employeeId: string;
    fullName: string;
    position: string;
    status: string;
    department: { name: string };
  }>;
  departmentDistribution: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <MainLayout title="Dashboard" subtitle="System Overview & Highlights">
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading dashboard stats...
        </div>
      </MainLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.totalEmployees ?? 0,
      icon: FiUsers,
      color: '#0d9488',
      bgColor: '#ccfbf1',
      subtitle: `${stats?.activeEmployees ?? 0} active`,
    },
    {
      title: 'Total Departments',
      value: stats?.totalDepartments ?? 0,
      icon: FiBriefcase,
      color: '#2563eb',
      bgColor: '#dbeafe',
      subtitle: 'Active divisions',
    },
    {
      title: 'Active Employees',
      value: stats?.activeEmployees ?? 0,
      icon: FiCheckCircle,
      color: '#16a34a',
      bgColor: '#dcfce7',
      subtitle: 'Currently employed',
    },
    {
      title: 'Pending Leaves',
      value: stats?.pendingLeaves ?? 0,
      icon: FiCalendar,
      color: '#d97706',
      bgColor: '#fef3c7',
      subtitle: 'Awaiting approval',
    },
  ];

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back, Administrator">
      {/* Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              style={{
                backgroundColor: '#ffffff',
                padding: '20px 24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  {card.title}
                </div>
                <div
                  style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '4px 0' }}
                >
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{card.subtitle}</div>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: card.bgColor,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                <Icon />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Employees Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              Recent Employee Additions
            </h3>
            <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '600' }}>
              Latest Records
            </span>
          </div>

          {!stats?.recentEmployees || stats.recentEmployees.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '20px 0' }}>
              No employees recorded yet.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: '12px' }}
                >
                  <th style={{ padding: '8px 12px' }}>ID</th>
                  <th style={{ padding: '8px 12px' }}>NAME</th>
                  <th style={{ padding: '8px 12px' }}>DEPARTMENT</th>
                  <th style={{ padding: '8px 12px' }}>POSITION</th>
                  <th style={{ padding: '8px 12px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEmployees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f9fafb', fontSize: '14px' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#0d9488' }}>
                      {emp.employeeId}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500', color: '#111827' }}>
                      {emp.fullName}
                    </td>
                    <td style={{ padding: '12px', color: '#4b5563' }}>{emp.department?.name}</td>
                    <td style={{ padding: '12px', color: '#4b5563' }}>{emp.position}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: emp.status === 'active' ? '#dcfce7' : '#fef3c7',
                          color: emp.status === 'active' ? '#166534' : '#92400e',
                          textTransform: 'uppercase',
                        }}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Side Panel: Today's Attendance & Department Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Today's Attendance */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              Today&apos;s Attendance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#166534' }}>
                  {stats?.attendanceToday.present ?? 0}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Present</div>
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#991b1b' }}>
                  {stats?.attendanceToday.absent ?? 0}
                </div>
                <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>Absent</div>
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fffbeb',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#92400e' }}>
                  {stats?.attendanceToday.late ?? 0}
                </div>
                <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>Late</div>
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f3e8ff',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#6b21a8' }}>
                  {stats?.attendanceToday.halfDay ?? 0}
                </div>
                <div style={{ fontSize: '12px', color: '#7e22ce', fontWeight: '600' }}>
                  Half Day
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              Department Breakdown
            </h3>
            {!stats?.departmentDistribution || stats.departmentDistribution.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No departments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.departmentDistribution.map((dept) => (
                  <div
                    key={dept.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      {dept.name}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {dept.count} emp
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
