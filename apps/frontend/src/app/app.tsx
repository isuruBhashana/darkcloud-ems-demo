import { Route, Routes } from 'react-router-dom';
import { AuthGuard } from '../components/layout/auth-guard';
import { AttendancePage } from '../pages/attendance/index';
import { DashboardPage } from '../pages/dashboard';
import { DepartmentsPage } from '../pages/departments/index';
import { EmployeesPage } from '../pages/employees/index';
import { LeavePage } from '../pages/leave/index';
import { LoginPage } from '../pages/login';
import { ReportsPage } from '../pages/reports/index';
import { SettingsPage } from '../pages/settings';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        }
      />
      <Route
        path="/employees"
        element={
          <AuthGuard>
            <EmployeesPage />
          </AuthGuard>
        }
      />
      <Route
        path="/departments"
        element={
          <AuthGuard>
            <DepartmentsPage />
          </AuthGuard>
        }
      />
      <Route
        path="/attendance"
        element={
          <AuthGuard>
            <AttendancePage />
          </AuthGuard>
        }
      />
      <Route
        path="/leave"
        element={
          <AuthGuard>
            <LeavePage />
          </AuthGuard>
        }
      />
      <Route
        path="/reports"
        element={
          <AuthGuard>
            <ReportsPage />
          </AuthGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGuard>
            <SettingsPage />
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;
