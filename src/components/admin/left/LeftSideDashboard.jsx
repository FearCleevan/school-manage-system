import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaBuilding, FaBook, FaClipboardList, FaMoneyBillWave,
    FaChartLine, FaCalendarCheck, FaGraduationCap, FaBell,
    FaCog, FaShieldAlt, FaHome, FaSignOutAlt, FaTimes
} from 'react-icons/fa';
import { auth } from "../../../lib/firebase/config";
import { signOut } from 'firebase/auth';
import { useAuth } from '../../../context/AuthContext';
import './leftSideDashboard.css';

const LeftSideDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData, setUserData } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [logoutOptions, setLogoutOptions] = useState({
        terminateAllSessions: false,
        clearCache: true
    });

    // Define menu items with their required permissions
    const menuItems = [
        { path: "/dashboard", icon: <FaHome />, label: "Dashboard", permission: "dashboard" },
        { path: "/dashboard/manage-student", icon: <FaGraduationCap />, label: "Student Management", permission: "manageStudent" },
        { path: "/dashboard/department", icon: <FaBuilding />, label: "Department", permission: "department" },
        { path: "/dashboard/course", icon: <FaBook />, label: "Course", permission: "course" },
        { path: "/dashboard/subjects", icon: <FaClipboardList />, label: "Subjects", permission: "subjects" },
        { path: "/dashboard/payment", icon: <FaMoneyBillWave />, label: "Payment Management", permission: "payment" },
        { path: "/dashboard/grading-system", icon: <FaChartLine />, label: "Grading System", permission: "gradingSystem" },
        { path: "/dashboard/attendance", icon: <FaCalendarCheck />, label: "Student Attendance", permission: "attendance" },
        { path: "/dashboard/announcement", icon: <FaBell />, label: "Announcement", permission: "announcement" },
        { path: "/dashboard/permission", icon: <FaShieldAlt />, label: "Account Permissions", permission: "accountPermission" },
        { path: "/dashboard/account-user-settings", icon: <FaCog />, label: "Account & User Settings", permission: "accountSettings" }
    ];

    const handleLogout = async () => {
        setLoading(true);
        try {
            // Clear authentication tokens and user data
            await signOut(auth);
            setUserData(null);

            // Clear cache if selected
            if (logoutOptions.clearCache) {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }
                
                // Clear localStorage and sessionStorage
                localStorage.clear();
                sessionStorage.clear();
            }

            // Terminate all sessions if selected (would typically call an API endpoint)
            if (logoutOptions.terminateAllSessions) {
                // In a real app, you would call your backend API here
                console.log("Terminating all active sessions");
            }

            // Add minimum delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Hard redirect to login with cache busting
            window.location.href = `/login?cache=${Date.now()}`;
            
        } catch (error) {
            console.error('Logout error:', error);
            setLoading(false);
            setShowLogoutModal(false);
        }
    };

    const hasPermission = (permission) => { 
        if (!userData?.permissions) return false;
        return userData.permissions.includes(permission);
    };

    const getActiveMenuItem = () => {
        const activeItem = menuItems.find(item => 
            location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
        );
        return activeItem || menuItems[0];
    };

    const activeMenuItem = getActiveMenuItem();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="left-sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">{activeMenuItem.label}</h2>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Businesses</h3>
                    <ul className="nav-menu">
                        {menuItems.map((item) => (
                            hasPermission(item.permission) && (
                                <li key={item.path} className="nav-item">
                                    <Link 
                                        to={item.path} 
                                        className={`nav-link ${location.pathname === item.path || 
                                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ? 
                                            'active' : ''}`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            )
                        ))}
                    </ul>
                </div>

                <div className="sidebar-section logout-section">
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <button 
                                onClick={() => setShowLogoutModal(true)} 
                                className="nav-link logout-btn"
                            >
                                <FaSignOutAlt className="nav-icon" />
                                <span>Log Out</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <div className="modal-header">
                            <h3>Confirm Logout</h3>
                            <button 
                                className="close-btn" 
                                onClick={() => setShowLogoutModal(false)}
                                aria-label="Close modal"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to log out?</p>
                            <div className="logout-options">
                                <label>
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
                                <label>
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
                        <div className="modal-footer">
                            <button 
                                className="cancel-btn"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="confirm-btn"
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