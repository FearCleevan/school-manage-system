import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaBuilding, FaBook, FaClipboardList, FaMoneyBillWave,
    FaChartLine, FaCalendarCheck, FaGraduationCap, FaBell,
    FaCog, FaShieldAlt, FaHome, FaSignOutAlt, FaTimes
} from "react-icons/fa";
import { auth } from "../../../lib/firebase/config";
import { signOut } from 'firebase/auth';
import styles from './LeftSideDashboard.module.css';

const LeftSideDashboard = () => {
    const location = useLocation();
    // const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logoutOptions, setLogoutOptions] = useState({
        terminateAllSessions: false,
        clearCache: true
    });

    const menuItems = [
        { path: "/dashboard", icon: <FaHome />, label: "Dashboard", permission: "dashboard" },
        { path: "/dashboard/manage-student", icon: <FaGraduationCap />, label: "Student Management", permission: "manageStudent" },
        // { path: "/dashboard/department", icon: <FaBuilding />, label: "Department", permission: "department" },
        // { path: "/dashboard/course", icon: <FaBook />, label: "Course", permission: "course" },
        { path: "/dashboard/subjects", icon: <FaClipboardList />, label: "Subject and Course Management", permission: "subjects" },
        { path: "/dashboard/payment", icon: <FaMoneyBillWave />, label: "Payment Management", permission: "payment" },
        // { path: "/dashboard/grading-system", icon: <FaChartLine />, label: "Grading System", permission: "gradingSystem" },
        // { path: "/dashboard/attendance", icon: <FaCalendarCheck />, label: "Student Attendance", permission: "attendance" },
        // { path: "/dashboard/announcement", icon: <FaBell />, label: "Announcement", permission: "announcement" },
        // { path: "/dashboard/permission", icon: <FaShieldAlt />, label: "Account Permissions", permission: "accountPermission" },
        { path: "/dashboard/account-user-settings", icon: <FaCog />, label: "Account & User Settings", permission: "accountSettings" }
    ];

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut(auth);

            if (logoutOptions.clearCache) {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }

                localStorage.clear();
                sessionStorage.clear();
            }

            if (logoutOptions.terminateAllSessions) {
                console.log("Terminating all active sessions");
            }

            // Redirect to login page with cache busting
            window.location.href = `/?cache=${Date.now()}`;
        } catch (error) {
            console.error('Logout error:', error);
            setLoading(false);
            setShowLogoutModal(false);
        }
    };

    const getActiveMenuItem = () => {
        // For dashboard index route
        if (location.pathname === '/dashboard') {
            return menuItems[0]; // Dashboard item
        }
        
        // For nested routes
        const activeItem = menuItems.find(item =>
            location.pathname.startsWith(item.path)
        );
        return activeItem || menuItems[0];
    };

    const activeMenuItem = getActiveMenuItem();

    if (loading) {
        return (
            <div className={styles.loadingOverlay}>
                <div className={styles.loadingSpinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.leftSidebar}>
            <div className={styles.sidebarHeader}>
                <h2 className={styles.sidebarTitle}>{activeMenuItem.label}</h2>
            </div>

            <nav className={styles.sidebarNav}>
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarSectionTitle}>Navigation</h3>
                    <ul className={styles.navMenu}>
                        {menuItems.map((item) => (
                            <li key={item.path} className={styles.navItem}>
                                <Link
                                    to={item.path}
                                    className={`${styles.navLink} ${
                                        location.pathname === item.path || 
                                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) 
                                            ? styles.active 
                                            : ''
                                    }`}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    <span className={styles.navLabel}>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.logoutSection}>
                    <ul className={styles.navMenu}>
                        <li className={styles.navItem}>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className={styles.navLink}
                            >
                                <span className={styles.navIcon}><FaSignOutAlt /></span>
                                <span className={styles.navLabel}>Log Out</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {showLogoutModal && (
                <div className={styles.logoutModalOverlay}>
                    <div className={styles.logoutModal}>
                        <div className={styles.modalHeader}>
                            <h3>Confirm Logout</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowLogoutModal(false)}
                                aria-label="Close modal"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Are you sure you want to log out?</p>
                            <div className={styles.logoutOptions}>
                                <label className={styles.optionLabel}>
                                    <input
                                        type="checkbox"
                                        checked={logoutOptions.terminateAllSessions}
                                        onChange={(e) => setLogoutOptions({
                                            ...logoutOptions,
                                            terminateAllSessions: e.target.checked
                                        })}
                                    />
                                    Terminate all active sessions
                                </label>
                                <label className={styles.optionLabel}>
                                    <input
                                        type="checkbox"
                                        checked={logoutOptions.clearCache}
                                        onChange={(e) => setLogoutOptions({
                                            ...logoutOptions,
                                            clearCache: e.target.checked
                                        })}
                                    />
                                    Clear cached data
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleLogout}
                                autoFocus
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeftSideDashboard;