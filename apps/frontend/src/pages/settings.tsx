import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiPlus, FiShield, FiTrash2, FiUser, FiUserCheck } from 'react-icons/fi';
import { MainLayout } from '../components/layout/main-layout';
import { api } from '../lib/api';
import { authClient } from '../lib/auth-client';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string;
  permissionsList: string[];
  createdAt: string;
}

const AVAILABLE_SECTIONS = [
  { id: 'employees', label: 'Employee Management' },
  { id: 'departments', label: 'Department Management' },
  { id: 'attendance', label: 'Attendance Management' },
  { id: 'leave', label: 'Leave Requests' },
  { id: 'reports', label: 'System Reports' },
  { id: 'settings', label: 'Admin Settings' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'admins'>('password');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  // Admin Management state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Admin Form State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'employees',
    'departments',
    'attendance',
    'leave',
    'reports',
  ]);
  const [adminErr, setAdminErr] = useState('');

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get('/admin-users');
      setAdmins(res.data);
    } catch (err) {
      console.error('Failed to load admin users', err);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab, fetchAdmins]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword !== confirmPassword) {
      setPasswordErr('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErr('New password must be at least 8 characters long');
      return;
    }

    setLoadingPassword(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.error) {
        setPasswordErr(res.error.message || 'Failed to change password');
      } else {
        setPasswordMsg('Administrator password successfully updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordErr('Failed to update password. Please check your current password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleOpenAddAdminModal = () => {
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setSelectedPermissions(['employees', 'departments', 'attendance', 'leave', 'reports']);
    setAdminErr('');
    setIsModalOpen(true);
  };

  const handleTogglePermission = (sectionId: string) => {
    if (selectedPermissions.includes(sectionId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== sectionId));
    } else {
      setSelectedPermissions([...selectedPermissions, sectionId]);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErr('');

    if (selectedPermissions.length === 0) {
      setAdminErr('Please select at least one section permission');
      return;
    }

    try {
      await api.post('/admin-users', {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        permissions: selectedPermissions,
      });
      setIsModalOpen(false);
      fetchAdmins();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAdminErr(msg || 'Failed to create administrator user');
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove administrator "${email}"?`)) {
      try {
        await api.delete(`/admin-users/${id}`);
        fetchAdmins();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
        alert(msg || 'Failed to delete administrator');
      }
    }
  };

  return (
    <MainLayout
      title="Administrator Settings"
      subtitle="Manage security, sub-administrators, & section permissions"
    >
      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'password' ? '#0d9488' : '#f3f4f6',
            color: activeTab === 'password' ? '#ffffff' : '#4b5563',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Change My Password
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'admins' ? '#0d9488' : '#f3f4f6',
            color: activeTab === 'admins' ? '#ffffff' : '#4b5563',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <FiShield />
          <span>Admin Users & Section Permissions</span>
        </button>
      </div>

      {/* Tab 1: Change Password */}
      {activeTab === 'password' && (
        <div
          style={{
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h3
            style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}
          >
            Change Administrator Password
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
            Ensure your administrator account uses a strong, unique password.
          </p>

          {passwordMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {passwordMsg}
            </div>
          )}

          {passwordErr && (
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
              {passwordErr}
            </div>
          )}

          <form
            onSubmit={handleChangePassword}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <label
                htmlFor="current-password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Current Password *
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                New Password *
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Confirm New Password *
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loadingPassword}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loadingPassword ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                alignSelf: 'flex-start',
              }}
            >
              {loadingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Admin Users & Section Permissions */}
      {activeTab === 'admins' && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                Administrator Accounts
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Create additional administrators and configure section-level access permissions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAdminModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <FiPlus />
              <span>Create Administrator</span>
            </button>
          </div>

          {/* Admin List Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {loadingAdmins ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Loading admin accounts...
              </div>
            ) : admins.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                No administrators found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                      color: '#4b5563',
                      fontSize: '12px',
                    }}
                  >
                    <th style={{ padding: '12px 16px' }}>ADMINISTRATOR</th>
                    <th style={{ padding: '12px 16px' }}>ROLE</th>
                    <th style={{ padding: '12px 16px' }}>ALLOWED SECTIONS</th>
                    <th style={{ padding: '12px 16px' }}>CREATED</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((adm) => (
                    <tr
                      key={adm.id}
                      style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: adm.role === 'SUPER_ADMIN' ? '#ccfbf1' : '#e0e7ff',
                              color: adm.role === 'SUPER_ADMIN' ? '#0f766e' : '#3730a3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {adm.role === 'SUPER_ADMIN' ? <FiUserCheck /> : <FiUser />}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{adm.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{adm.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: adm.role === 'SUPER_ADMIN' ? '#dcfce7' : '#e0e7ff',
                            color: adm.role === 'SUPER_ADMIN' ? '#166534' : '#3730a3',
                          }}
                        >
                          {adm.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {adm.permissionsList.includes('all') ? (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#f0fdf4',
                                color: '#166534',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                            >
                              Full System Access (All)
                            </span>
                          ) : (
                            adm.permissionsList.map((sec) => (
                              <span
                                key={sec}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                  fontSize: '12px',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {sec}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {new Date(adm.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {adm.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            title="Remove Administrator"
                            onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                            style={{
                              padding: '6px',
                              border: 'none',
                              background: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                            }}
                          >
                            <FiTrash2 style={{ fontSize: '16px' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Create New Administrator Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#111827' }}>
              Create New Administrator
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>
              Assign credentials and specific section access permissions.
            </p>

            {adminErr && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {adminErr}
              </div>
            )}

            <form
              onSubmit={handleCreateAdmin}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Connor"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@darkcloud.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  Section Access Permissions *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {AVAILABLE_SECTIONS.map((sec) => {
                    const isChecked = selectedPermissions.includes(sec.id);
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleTogglePermission(sec.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid #0d9488' : '1px solid #d1d5db',
                          backgroundColor: isChecked ? '#f0fdf4' : '#ffffff',
                          color: isChecked ? '#0f766e' : '#374151',
                          fontSize: '13px',
                          fontWeight: isChecked ? '600' : '400',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: isChecked ? 'none' : '1px solid #9ca3af',
                            backgroundColor: isChecked ? '#0d9488' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '12px',
                          }}
                        >
                          {isChecked && <FiCheck />}
                        </div>
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
