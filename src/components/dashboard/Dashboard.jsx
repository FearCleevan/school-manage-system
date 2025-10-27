import React, { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LeftSideDashboard from "../admin/left/LeftSideDashboard";
import CenterSideDashboard from "../admin/center/CenterSideDashboard";
import RightSideDashboard from "../admin/right/RightSideDashboard";
import { useAuth } from "../../context/AuthContext";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  

  const pathChecks = [
    'account-user-settings',
    'manage-student',
    'department',
    'course',
    'subjects',
    'payment',
    'grading-system',
    'attendance',
    'announcement',
    'permission'
  ].some(path => location.pathname.includes(path));

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading || showLoading) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const userName = userData
    ? `${userData.firstName} ${userData.middleName || ''} ${userData.lastName}`.replace(/\s+/g, ' ').trim()
    : currentUser.displayName || "User";

  const userRole = userData?.role || "admin";
  const userProfileImage = userData?.photoURL || currentUser.photoURL || "/Profile-image.gif";

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.logoContainer}>
            <img
              src="/school-logo.png"
              alt="School-Logo"
              className={styles.schoolLogo}
            />
          </div>
          <span className={styles.headerTitle}>Samson Admin</span>
          <button className={styles.menuToggle}>
            <FaBars />
          </button>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userProfile}>
            <img
              src={userProfileImage}
              alt="User Profile"
              className={styles.profileImage}
            />
          </div>
          <div className={styles.nameAccess}>
            <p className={styles.userName}>{userName}</p>
            <span className={styles.userRole}>{userRole}</span>
          </div>
        </div>
      </header>

      <div className={styles.dashboardContent}>
        <LeftSideDashboard />
        {!pathChecks && <CenterSideDashboard />}
        <Outlet />
        {!pathChecks && <RightSideDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;