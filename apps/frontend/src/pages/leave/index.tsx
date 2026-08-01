import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiPlus, FiX } from 'react-icons/fi';
import { MainLayout } from '../../components/layout/main-layout';
import { api } from '../../lib/api';

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  createdAt: string;
  employee: {
    id: string;
    employeeId: string;
    fullName: string;
    department?: { name: string };
  };
}

export function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const fetchLeaveRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const res = await api.get(`/leave-requests?${params.toString()}`);
      setLeaveRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch leave requests', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();
  }, [fetchLeaveRequests]);

  const handleOpenAddModal = () => {
    setEmployeeId(employees[0]?.id || '');
    setLeaveType('annual');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Rule: Leave end date must be after the start date
    if (end <= start) {
      setError('Leave end date must be after the start date');
      return;
    }

    try {
      await api.post('/leave-requests', { employeeId, leaveType, startDate, endDate, reason });
      setIsModalOpen(false);
      fetchLeaveRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to submit leave request');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/leave-requests/${id}`, { status: newStatus });
      fetchLeaveRequests();
    } catch {
      alert('Failed to update leave request status');
    }
  };

  return (
    <MainLayout
      title="Leave Management"
      subtitle="Process employee leave requests & review history"
    >
      {/* Controls & Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            Filter Status:
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
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
          <span>New Leave Request</span>
        </button>
      </div>

      {/* Leave Requests Table */}
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
            Loading leave requests...
          </div>
        ) : leaveRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No leave requests recorded.
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
                <th style={{ padding: '12px 16px' }}>EMPLOYEE</th>
                <th style={{ padding: '12px 16px' }}>LEAVE TYPE</th>
                <th style={{ padding: '12px 16px' }}>START DATE</th>
                <th style={{ padding: '12px 16px' }}>END DATE</th>
                <th style={{ padding: '12px 16px' }}>REASON</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>
                      {req.employee?.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0d9488' }}>
                      {req.employee?.employeeId} ({req.employee?.department?.name})
                    </div>
                  </td>
                  <td
                    style={{ padding: '14px 16px', textTransform: 'capitalize', fontWeight: '500' }}
                  >
                    {req.leaveType}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>
                    {new Date(req.startDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>
                    {new Date(req.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', maxWidth: '200px' }}>
                    {req.reason || '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor:
                          req.status === 'approved'
                            ? '#dcfce7'
                            : req.status === 'rejected'
                              ? '#fee2e2'
                              : '#fef3c7',
                        color:
                          req.status === 'approved'
                            ? '#166534'
                            : req.status === 'rejected'
                              ? '#991b1b'
                              : '#92400e',
                        textTransform: 'uppercase',
                      }}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          title="Approve Leave"
                          onClick={() => handleUpdateStatus(req.id, 'approved')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <FiCheck /> Approve
                        </button>
                        <button
                          type="button"
                          title="Reject Leave"
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <FiX /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Leave Request Modal */}
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
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              Create Leave Request
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
                  Employee *
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
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
                    Select employee
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeId} - {emp.fullName}
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
                  Leave Type *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
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
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '4px',
                    }}
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                  Reason for Leave
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide reason for request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
