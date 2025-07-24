import React from 'react';
import { 
  FaTimes, FaUserCircle,
  FaHome, FaGraduationCap, FaBuilding, 
  FaBook, FaClipboardList, FaMoneyBillWave,
  FaChartLine, FaCalendarCheck, FaBell,
  FaShieldAlt, FaCog
} from 'react-icons/fa';
import styles from './ViewUserModal.module.css';

const ViewUserModal = ({ isOpen, onClose, user }) => {
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>User Profile Details</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.userContent}>
          <div className={styles.profileSection}>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className={styles.profileImage} 
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                <FaUserCircle />
              </div>
            )}
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>User ID:</span>
              <span className={styles.detailValue}>{user.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Full Name:</span>
              <span className={styles.detailValue}>
                {user.firstName} {user.middleName} {user.lastName}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email:</span>
              <span className={styles.detailValue}>{user.email}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Role:</span>
              <span className={`${styles.detailValue} ${styles.roleBadge}`}>{user.role}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status:</span>
              <span className={`${styles.detailValue} ${styles.statusBadge} ${
                user.status === 'active' ? styles.statusActive : styles.statusInactive
              }`}>
                {user.status}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Permissions:</span>
              <div className={styles.permissionsGrid}>
                {permissionOptions.map(({ key, label, icon }) => (
                  user.permissions?.includes(key) && (
                    <div key={key} className={styles.permissionItem} title={label}>
                      <span className={styles.permissionIcon}>{icon}</span>
                      <span className={styles.permissionLabel}>{label}</span>
                    </div>
                  )
                ))}
                {user.permissions?.length === 0 && (
                  <span className={styles.noPermissions}>No permissions assigned</span>
                )}
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Last Login:</span>
              <span className={styles.detailValue}>{user.lastLogin || 'Never logged in'}</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;