import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUser } from 'react-icons/fi';
import { MainLayout } from '../../components/layout/main-layout';
import { api } from '../../lib/api';

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  departmentId: string;
  department: { id: string; name: string };
  position: string;
  phone: string;
  email: string;
  dateJoined: string;
  salary: number;
  status: string;
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    departmentId: '',
    position: '',
    phone: '',
    email: '',
    dateJoined: new Date().toISOString().split('T')[0],
    salary: 0,
    status: 'active',
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/employees?${params.toString()}`);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, selectedStatus]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [fetchEmployees]);

  const handleOpenAddModal = () => {
    setEditEmployee(null);
    setFormData({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      departmentId: departments[0]?.id || '',
      position: '',
      phone: '',
      email: '',
      dateJoined: new Date().toISOString().split('T')[0],
      salary: 50000,
      status: 'active',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      departmentId: emp.departmentId,
      position: emp.position,
      phone: emp.phone,
      email: emp.email,
      dateJoined: new Date(emp.dateJoined).toISOString().split('T')[0],
      salary: emp.salary,
      status: emp.status,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (Number(formData.salary) < 0) {
      setError('Salary cannot be negative');
      return;
    }

    try {
      if (editEmployee) {
        await api.patch(`/employees/${editEmployee.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save employee record');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete employee "${name}"?`)) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch {
        alert('Failed to delete employee');
      }
    }
  };

  return (
    <MainLayout title="Employee Management" subtitle="View, filter, and manage staff records">
      {/* Action Header & Search Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          backgroundColor: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '24px',
        }}
      >
        <div
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1 }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <FiSearch
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, ID, position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
        </div>

        {/* Add Employee Button */}
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
            boxShadow: '0 2px 4px rgba(13,148,136,0.2)',
          }}
        >
          <FiPlus />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Employees Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No employee records found matching criteria.
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
                <th style={{ padding: '12px 16px' }}>EMP ID</th>
                <th style={{ padding: '12px 16px' }}>FULL NAME</th>
                <th style={{ padding: '12px 16px' }}>DEPARTMENT</th>
                <th style={{ padding: '12px 16px' }}>POSITION</th>
                <th style={{ padding: '12px 16px' }}>CONTACT</th>
                <th style={{ padding: '12px 16px' }}>SALARY</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0d9488' }}>
                    {emp.employeeId}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#111827' }}>
                    {emp.fullName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>{emp.department?.name}</td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>{emp.position}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', color: '#111827' }}>{emp.email}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{emp.phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#111827' }}>
                    ${emp.salary?.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor:
                          emp.status === 'active'
                            ? '#dcfce7'
                            : emp.status === 'on-leave'
                              ? '#fef3c7'
                              : '#fee2e2',
                        color:
                          emp.status === 'active'
                            ? '#166534'
                            : emp.status === 'on-leave'
                              ? '#92400e'
                              : '#991b1b',
                        textTransform: 'uppercase',
                      }}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => setViewEmployee(emp)}
                      style={{
                        marginRight: '8px',
                        padding: '6px',
                        border: 'none',
                        background: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                      }}
                    >
                      <FiUser style={{ fontSize: '16px' }} />
                    </button>
                    <button
                      type="button"
                      title="Edit Employee"
                      onClick={() => handleOpenEditModal(emp)}
                      style={{
                        marginRight: '8px',
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
                      title="Delete Employee"
                      onClick={() => handleDelete(emp.id, emp.fullName)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Details Modal */}
      {viewEmployee && (
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
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              Employee Details — {viewEmployee.employeeId}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                fontSize: '14px',
              }}
            >
              <div>
                <strong>Full Name:</strong>
                <div>{viewEmployee.fullName}</div>
              </div>
              <div>
                <strong>Department:</strong>
                <div>{viewEmployee.department?.name}</div>
              </div>
              <div>
                <strong>Position:</strong>
                <div>{viewEmployee.position}</div>
              </div>
              <div>
                <strong>Employment Status:</strong>
                <div style={{ textTransform: 'capitalize' }}>{viewEmployee.status}</div>
              </div>
              <div>
                <strong>Email:</strong>
                <div>{viewEmployee.email}</div>
              </div>
              <div>
                <strong>Phone:</strong>
                <div>{viewEmployee.phone}</div>
              </div>
              <div>
                <strong>Date Joined:</strong>
                <div>{new Date(viewEmployee.dateJoined).toLocaleDateString()}</div>
              </div>
              <div>
                <strong>Salary:</strong>
                <div>${viewEmployee.salary?.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ marginTop: '28px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setViewEmployee(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
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
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              {editEmployee ? 'Update Employee Information' : 'Add New Employee'}
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
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
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
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                  Department *
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                  Position *
                </label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  Phone *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  Salary ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })
                  }
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
                  Date Joined *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateJoined}
                  onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
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

              <div style={{ gridColumn: 'span 2' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Employment Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              <div
                style={{
                  gridColumn: 'span 2',
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
                  {editEmployee ? 'Update Record' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
