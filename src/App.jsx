import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/login/Login';
import Dashboard from './components/dashboard/Dashboard';
import AccountUserSettings from './components/accountsettings/AccountUserSettings';
import StudentManagement from './components/manageStudent/StudentManagement';
import Department from './components/department/Department';
import Course from './components/course/Course';
import Subjects from './components/subjects/Subjects';
import Payment from './components/payment/Payment';
import GradingSystem from './components/gradingsystem/GradingSystem';
import Attendance from './components/attendance/Attendance';
import Announcement from './components/announcement/Announcement';
import Permission from './components/permission/Permission';

const ProtectedRoute = ({ children, requiredPermissions = [] }) => {
  const { currentUser, userData, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1000
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Check if user has all required permissions
  const hasAllPermissions = requiredPermissions.every(perm => hasPermission(perm));

  if (requiredPermissions.length > 0 && !hasAllPermissions) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route
              path="account-user-settings"
              element={
                <ProtectedRoute requiredPermissions={['accountSettings']}>
                  <AccountUserSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage-student"
              element={
                <ProtectedRoute requiredPermissions={['manageStudent']}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="department"
              element={
                <ProtectedRoute requiredPermissions={['department']}>
                  <Department />
                </ProtectedRoute>
              }
            />
            <Route
              path="course"
              element={
                <ProtectedRoute requiredPermissions={['course']}>
                  <Course />
                </ProtectedRoute>
              }
            />
            <Route
              path="subjects"
              element={
                <ProtectedRoute requiredPermissions={['subjects']}>
                  <Subjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment"
              element={
                <ProtectedRoute requiredPermissions={['payment']}>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="grading-system"
              element={
                <ProtectedRoute requiredPermissions={['gradingSystem']}>
                  <GradingSystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <ProtectedRoute requiredPermissions={['attendance']}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcement"
              element={
                <ProtectedRoute requiredPermissions={['announcement']}>
                  <Announcement />
                </ProtectedRoute>
              }
            />
            <Route
              path="permission"
              element={
                <ProtectedRoute requiredPermissions={['accountPermission']}>
                  <Permission />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;