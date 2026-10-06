import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import RoleRoute from "./routes/RoleRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/employees/Employees";
import EmployeeForm from "./pages/employees/EmployeeForm";
import EmployeeDetails from "./pages/employees/EmployeeDetails";
import Departments from "./pages/organization/Departments";
import Designations from "./pages/organization/Designations";
import Attendance from "./pages/attendance/Attendance";
import MyAttendance from "./pages/attendance/MyAttendance";
import AttendanceCalendar from "./pages/attendance/AttendanceCalendar";
import Leave from "./pages/leave/Leave";
import ApplyLeave from "./pages/leave/ApplyLeave";
import LeaveRequests from "./pages/leave/LeaveRequests";
import LeaveDetails from "./pages/leave/LeaveDetails";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { HR_ROLES, TEAM_ROLES } from "./utils/roles";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* everyone */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-attendance" element={<MyAttendance />} />
            <Route path="/attendance/calendar" element={<AttendanceCalendar />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/leave/apply" element={<ApplyLeave />} />
            <Route path="/leave/:id" element={<LeaveDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />

            {/* HR + managers (managers see their own team only; the server enforces it) */}
            <Route element={<RoleRoute roles={TEAM_ROLES} />}>
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeDetails />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave/requests" element={<LeaveRequests />} />
            </Route>

            {/* HR only */}
            <Route element={<RoleRoute roles={HR_ROLES} />}>
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/employees/:id/edit" element={<EmployeeForm />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/designations" element={<Designations />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
