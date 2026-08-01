import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { MainLayout } from '../../components/layout/main-layout';
import { api } from '../../lib/api';

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks?: string;
  employee: {
    id: string;
    employeeId: string;
    fullName: string;
    position?: string;
  };
}

export function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('present');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const fetchAttendance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterEmployeeId) params.append('employeeId', filterEmployeeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/attendance?${params.toString()}`);
      setAttendance(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance records', err);
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, startDate, endDate]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, [fetchAttendance]);

  const handleOpenAddModal = () => {
    setEditRecord(null);
    setEmployeeId(employees[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('present');
    setRemarks('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setEditRecord(rec);
    setEmployeeId(rec.employee.id);
    setDate(new Date(rec.date).toISOString().split('T')[0]);
    setStatus(rec.status);
    setRemarks(rec.remarks || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editRecord) {
        await api.patch(`/attendance/${editRecord.id}`, { status, remarks });
      } else {
        await api.post('/attendance', { employeeId, date, status, remarks });
      }
      setIsModalOpen(false);
      fetchAttendance();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save attendance record');
    }
  };

  return (
    <MainLayout
      title="Attendance Management"
      subtitle="Track daily staff presence & attendance history"
    >
      {/* Controls & Filters Header */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Employee Filter */}
          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeId} - {emp.fullName}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>to</span>
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Record Attendance Button */}
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
          <span>Record Daily Attendance</span>
        </button>
      </div>

      {/* Attendance History Table */}
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
            Loading attendance records...
          </div>
        ) : attendance.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No attendance records recorded for selected period.
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
                <th style={{ padding: '12px 16px' }}>DATE</th>
                <th style={{ padding: '12px 16px' }}>EMP ID</th>
                <th style={{ padding: '12px 16px' }}>EMPLOYEE NAME</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px' }}>REMARKS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#111827' }}>
                    {new Date(rec.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0d9488' }}>
                    {rec.employee?.employeeId}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '500', color: '#111827' }}>
                    {rec.employee?.fullName}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor:
                          rec.status === 'present'
                            ? '#dcfce7'
                            : rec.status === 'absent'
                              ? '#fee2e2'
                              : rec.status === 'late'
                                ? '#fef3c7'
                                : '#f3e8ff',
                        color:
                          rec.status === 'present'
                            ? '#166534'
                            : rec.status === 'absent'
                              ? '#991b1b'
                              : rec.status === 'late'
                                ? '#92400e'
                                : '#6b21a8',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280' }}>{rec.remarks || '-'}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      title="Update Attendance"
                      onClick={() => handleOpenEditModal(rec)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record / Edit Attendance Modal */}
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
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              {editRecord ? 'Update Attendance Status' : 'Record Daily Attendance'}
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
              {!editRecord && (
                <>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                    >
                      Select Employee *
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
                      Attendance Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
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
                </>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '4px',
                  }}
                >
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
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
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional notes e.g., Approved late arrival"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
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
                  {editRecord ? 'Update Record' : 'Record Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
