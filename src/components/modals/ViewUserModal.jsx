import React from 'react';
import { 
  FaTimes, FaUserCircle,
  FaHome, FaGraduationCap, FaBuilding, 
  FaBook, FaClipboardList, FaMoneyBillWave,
  FaChartLine, FaCalendarCheck, FaBell,
  FaShieldAlt, FaCog
} from 'react-icons/fa';
import './viewUserModal.css';

const ViewUserModal = ({ isOpen, onClose, user }) => {
  // Permission options with icons matching other modals
  const permissionOptions = [
    { key: 'dashboard', label: 'Dashboard', icon: <FaHome /> },
    { key: 'manageStudent', label: 'Student Management', icon: <FaGraduationCap /> },
    { key: 'department', label: 'Department', icon: <FaBuilding /> },
    { key: 'course', label: 'Course', icon: <FaBook /> },
    { key: 'subjects', label: 'Subjects', icon: <FaClipboardList /> },
    { key: 'payment', label: 'Payment Management', icon: <FaMoneyBillWave /> },
    { key: 'gradingSystem', label: 'Grading System', icon: <FaChartLine /> },
    { key: 'attendance', label: 'Student Attendance', icon: <FaCalendarCheck /> },
    { key: 'announcement', label: 'Announcement', icon: <FaBell /> },
    { key: 'accountPermission', label: 'Account Permissions', icon: <FaShieldAlt /> },
    { key: 'accountSettings', label: 'Account & User Settings', icon: <FaCog /> }
  ];

  if (!isOpen || !user) return null;

  return (
    <div className="view-modal-overlay">
      <div className="view-modal-container">
        <div className="view-modal-header">
          <h3 className="view-modal-title">User Profile Details</h3>
          <button className="view-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="view-user-content">
          <div className="view-profile-section">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="view-profile-image" 
              />
            ) : (
              <div className="view-profile-placeholder">
                <FaUserCircle />
              </div>
            )}
          </div>

          <div className="view-details-grid">
            <div className="view-detail-item">
              <span className="view-detail-label">User ID:</span>
              <span className="view-detail-value">{user.id}</span>
            </div>
            <div className="view-detail-item">
              <span className="view-detail-label">Full Name:</span>
              <span className="view-detail-value">
                {user.firstName} {user.middleName} {user.lastName}
              </span>
            </div>
            <div className="view-detail-item">
              <span className="view-detail-label">Email:</span>
              <span className="view-detail-value">{user.email}</span>
            </div>
            <div className="view-detail-item">
              <span className="view-detail-label">Role:</span>
              <span className="view-detail-value view-role-badge">{user.role}</span>
            </div>
            <div className="view-detail-item">
              <span className="view-detail-label">Status:</span>
              <span className={`view-detail-value view-status-badge view-status-${user.status}`}>
                {user.status}
              </span>
            </div>
            <div className="view-detail-item">
              <span className="view-detail-label">Permissions:</span>
              <div className="view-permissions-grid">
                {permissionOptions.map(({ key, label, icon }) => (
                  user.permissions?.includes(key) && (
                    <div key={key} className="view-permission-item" title={label}>
                      <span className="view-permission-icon">{icon}</span>
                      <span className="view-permission-label">{label}</span>
                    </div>
                  )
                ))}
                {user.permissions?.length === 0 && (
                  <span className="view-no-permissions">No permissions assigned</span>
                )}
              </div>
            </div>
            <div className="view-detail-item">
              <span className="view-detail-label">Last Login:</span>
              <span className="view-detail-value">{user.lastLogin || 'Never logged in'}</span>
            </div>
          </div>
        </div>

        <div className="view-modal-footer">
          <button className="view-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;