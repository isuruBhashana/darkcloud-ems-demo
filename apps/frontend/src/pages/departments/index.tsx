import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FiBriefcase, FiEdit2, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { MainLayout } from '../../components/layout/main-layout';
import { api } from '../../lib/api';

interface Department {
  id: string;
  name: string;
  description?: string;
  _count?: { employees: number };
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenAddModal = () => {
    setEditDepartment(null);
    setName('');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditDepartment(dept);
    setName(dept.name);
    setDescription(dept.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editDepartment) {
        await api.patch(`/departments/${editDepartment.id}`, { name, description });
      } else {
        await api.post('/departments', { name, description });
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save department');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete department "${name}"?`)) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
        alert(msg || 'Failed to delete department');
      }
    }
  };

  return (
    <MainLayout
      title="Department Management"
      subtitle="Manage organizational units & employee assignments"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Total Departments: <strong>{departments.length}</strong>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
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
          <span>Add Department</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
          }}
        >
          No departments created yet. Click "Add Department" to get started.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {departments.map((dept) => (
            <div
              key={dept.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    <FiBriefcase />
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      title="Edit Department"
                      onClick={() => handleOpenEditModal(dept)}
                      style={{
                        padding: '6px',
                        border: 'none',
                        background: 'none',
                        color: '#0d9488',
                        cursor: 'pointer',
                      }}
                    >
                      <FiEdit2 style={{ fontSize: '16px' }} />
                    </button>
                    <button
                      type="button"
                      title="Delete Department"
                      onClick={() => handleDelete(dept.id, dept.name)}
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
                  </div>
                </div>

                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#111827',
                  }}
                >
                  {dept.name}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', minHeight: '40px' }}>
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                <FiUsers style={{ color: '#0d9488' }} />
                <span>{dept._count?.employees || 0} Assigned Employees</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
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
              maxWidth: '440px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              {editDepartment ? 'Edit Department' : 'Add New Department'}
            </h2>

            {error && (
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
                {error}
              </div>
            )}

            <form
              onSubmit={handleSave}
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
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Human Resources"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of department responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '12px',
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
                  {editDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
