import React, { useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LeftSideDashboard from "../admin/left/LeftSideDashboard";
import CenterSideDashboard from "../admin/center/CenterSideDashboard";
import RightSideDashboard from "../admin/right/RightSideDashboard";
import { useAuth } from "../../context/AuthContext";
import "./dashboard.css";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, loading } = useAuth();
  const isAccountSettings = location.pathname.includes('account-user-settings');
  const isStudentManagement = location.pathname.includes('manage-student');
  const isDepartment = location.pathname.includes('department');
  const isCourse = location.pathname.includes('course');
  const isSubjects = location.pathname.includes('subjects');
  const isPayment = location.pathname.includes('payment');
  const isGradingSystem = location.pathname.includes('grading-system');
  const isAttendance = location.pathname.includes('attendance');
  const isAnnouncement = location.pathname.includes('announcement');
  const isPermission = location.pathname.includes('permission');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/');
    }
  }, [currentUser, loading, navigate]);

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
    return null; // Will redirect from useEffect
  }

  // Get user display information
  const userName = userData
    ? `${userData.firstName} ${userData.middleName} ${userData.lastName}`
    : currentUser.displayName || "User";

  const userRole = userData?.role || "admin";
  const userProfileImage = userData?.photoURL || currentUser.photoURL || "/Profile-image.gif";

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <img
              src="/school-logo.png"
              alt="School Logo"
              className="school-logo"
            />
          </div>
          <span className="header-title">Samson Admin</span>
          <button className="menu-toggle">
            <FaBars />
          </button>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <img
              src={userProfileImage}
              alt="User Profile"
              className="profile-image"
            />
          </div>
          <div className="name-access">
            <p className="user-name">{userName}</p>
            <span className="user-role">{userRole}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <LeftSideDashboard />
        {!isAccountSettings && !isStudentManagement && !isDepartment && !isCourse && !isSubjects && !isPayment && !isGradingSystem && !isAttendance  && !isAnnouncement && !isPermission && <CenterSideDashboard />}
        <Outlet />
        {!isAccountSettings && !isStudentManagement && !isDepartment && !isCourse && !isSubjects && !isPayment && !isGradingSystem && !isAttendance && !isAnnouncement && !isPermission && <RightSideDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;