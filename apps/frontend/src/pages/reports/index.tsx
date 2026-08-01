import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { MainLayout } from '../../components/layout/main-layout';
import { api } from '../../lib/api';

type ReportType = 'employee' | 'attendance' | 'leave';

interface EmployeeReportItem {
  employeeId: string;
  fullName: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  dateJoined: string;
  salary: number;
  status: string;
}

interface AttendanceReportItem {
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  status: string;
  remarks: string;
}

interface LeaveReportItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('employee');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchReportData() {
      setLoading(true);
      try {
        if (activeTab === 'employee') {
          const res = await api.get('/reports/employees');
          setData(res.data);
        } else if (activeTab === 'attendance') {
          const res = await api.get('/reports/attendance');
          setData(res.data);
        } else if (activeTab === 'leave') {
          const res = await api.get('/reports/leave');
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch report data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [activeTab]);

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `${activeTab.toUpperCase()} REPORT`;
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    if (activeTab === 'employee') {
      const headers = [['ID', 'Name', 'Department', 'Position', 'Salary', 'Status']];
      const rows = (data as unknown as EmployeeReportItem[]).map((e) => [
        e.employeeId,
        e.fullName,
        e.department,
        e.position,
        `$${e.salary.toLocaleString()}`,
        e.status,
      ]);
      autoTable(doc, { head: headers, body: rows, startY: 34 });
    } else if (activeTab === 'attendance') {
      const headers = [['Date', 'Emp ID', 'Name', 'Department', 'Status', 'Remarks']];
      const rows = (data as unknown as AttendanceReportItem[]).map((a) => [
        new Date(a.date).toLocaleDateString(),
        a.employeeId,
        a.employeeName,
        a.department,
        a.status,
        a.remarks,
      ]);
      autoTable(doc, { head: headers, body: rows, startY: 34 });
    } else if (activeTab === 'leave') {
      const headers = [['Emp ID', 'Name', 'Leave Type', 'Start Date', 'End Date', 'Status']];
      const rows = (data as unknown as LeaveReportItem[]).map((l) => [
        l.employeeId,
        l.employeeName,
        l.leaveType,
        new Date(l.startDate).toLocaleDateString(),
        new Date(l.endDate).toLocaleDateString(),
        l.status,
      ]);
      autoTable(doc, { head: headers, body: rows, startY: 34 });
    }

    doc.save(`${activeTab}_report_${Date.now()}.pdf`);
  };

  // Export to Excel
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${activeTab.toUpperCase()} Report`);

    if (activeTab === 'employee') {
      worksheet.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Full Name', key: 'fullName', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Salary', key: 'salary', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      data.forEach((row) => {
        worksheet.addRow(row);
      });
    } else if (activeTab === 'attendance') {
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 25 },
      ];
      data.forEach((row) => {
        worksheet.addRow(row);
      });
    } else if (activeTab === 'leave') {
      worksheet.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Leave Type', key: 'leaveType', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Reason', key: 'reason', width: 30 },
      ];
      data.forEach((row) => {
        worksheet.addRow(row);
      });
    }

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0D9488' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${activeTab}_report_${Date.now()}.xlsx`);
  };

  return (
    <MainLayout
      title="System Reports"
      subtitle="Generate & export employee, attendance, and leave reports"
    >
      {/* Tabs & Export Toolbar */}
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
        {/* Report Type Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['employee', 'attendance', 'leave'] as ReportType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab ? '#0d9488' : '#f3f4f6',
                color: activeTab === tab ? '#ffffff' : '#4b5563',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab} Report
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={exportPDF}
            disabled={data.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #dc2626',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontWeight: '600',
              fontSize: '13px',
              cursor: data.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <FiFileText /> Export PDF
          </button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={data.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #16a34a',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              fontWeight: '600',
              fontSize: '13px',
              cursor: data.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <FiDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Data Preview Table */}
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
            Generating {activeTab} report...
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No data available for this report.
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
                {activeTab === 'employee' && (
                  <>
                    <th style={{ padding: '12px 16px' }}>EMP ID</th>
                    <th style={{ padding: '12px 16px' }}>FULL NAME</th>
                    <th style={{ padding: '12px 16px' }}>DEPARTMENT</th>
                    <th style={{ padding: '12px 16px' }}>POSITION</th>
                    <th style={{ padding: '12px 16px' }}>EMAIL</th>
                    <th style={{ padding: '12px 16px' }}>SALARY</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                  </>
                )}
                {activeTab === 'attendance' && (
                  <>
                    <th style={{ padding: '12px 16px' }}>DATE</th>
                    <th style={{ padding: '12px 16px' }}>EMP ID</th>
                    <th style={{ padding: '12px 16px' }}>NAME</th>
                    <th style={{ padding: '12px 16px' }}>DEPARTMENT</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px' }}>REMARKS</th>
                  </>
                )}
                {activeTab === 'leave' && (
                  <>
                    <th style={{ padding: '12px 16px' }}>EMP ID</th>
                    <th style={{ padding: '12px 16px' }}>NAME</th>
                    <th style={{ padding: '12px 16px' }}>DEPARTMENT</th>
                    <th style={{ padding: '12px 16px' }}>LEAVE TYPE</th>
                    <th style={{ padding: '12px 16px' }}>START DATE</th>
                    <th style={{ padding: '12px 16px' }}>END DATE</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'employee' &&
                (data as unknown as EmployeeReportItem[]).map((item, idx) => (
                  <tr
                    key={item.employeeId || idx}
                    style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0d9488' }}>
                      {item.employeeId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{item.fullName}</td>
                    <td style={{ padding: '14px 16px' }}>{item.department}</td>
                    <td style={{ padding: '14px 16px' }}>{item.position}</td>
                    <td style={{ padding: '14px 16px' }}>{item.email}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                      ${item.salary?.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>
                      {item.status}
                    </td>
                  </tr>
                ))}

              {activeTab === 'attendance' &&
                (data as unknown as AttendanceReportItem[]).map((item, idx) => (
                  <tr
                    key={item.employeeId + idx}
                    style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0d9488' }}>
                      {item.employeeId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{item.employeeName}</td>
                    <td style={{ padding: '14px 16px' }}>{item.department}</td>
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>
                      {item.status}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{item.remarks}</td>
                  </tr>
                ))}

              {activeTab === 'leave' &&
                (data as unknown as LeaveReportItem[]).map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0d9488' }}>
                      {item.employeeId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{item.employeeName}</td>
                    <td style={{ padding: '14px 16px' }}>{item.department}</td>
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>
                      {item.leaveType}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {new Date(item.startDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>
                      {item.status}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
