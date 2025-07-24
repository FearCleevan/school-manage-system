import React, { useState, useEffect, useRef } from 'react';
import {
  FaTimes, FaUserCircle, FaUpload,
  FaHome, FaGraduationCap, FaBuilding,
  FaBook, FaClipboardList, FaMoneyBillWave,
  FaChartLine, FaCalendarCheck, FaBell,
  FaShieldAlt, FaCog
} from 'react-icons/fa';
import styles from './EditUserModal.module.css';

const EditUserModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    status: 'active',
    permissions: [],
    profile: null
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        status: user.status || 'active',
        permissions: user.permissions || [],
        profile: user.photoURL || null
      });
      setPreviewImage(user.photoURL || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select an image file (JPEG, PNG)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData(prev => ({ ...prev, profile: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.firstName || !formData.lastName) {
        throw new Error('First name and last name are required');
      }

      if (formData.permissions.length === 0) {
        throw new Error('At least one permission must be selected');
      }

      const userToSave = {
        id: formData.id,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        status: formData.status,
        permissions: formData.permissions
      };

      if (typeof formData.profile === 'object') {
        userToSave.profileImageFile = formData.profile;
      } else if (formData.profile) {
        userToSave.photoURL = formData.profile;
      }

      await onSave(userToSave);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>Edit User Profile</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.profileUploadContainer}>
            <div className={styles.profileImagePreview}>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className={styles.profilePreview}
                />
              ) : (
                <FaUserCircle className={styles.defaultProfileIcon} />
              )}
            </div>
            <div className={styles.uploadControls}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current.click()}
                disabled={isSubmitting}
              >
                <FaUpload /> {previewImage ? 'Change Photo' : 'Upload Photo'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={isSubmitting}
              />
              {previewImage && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData(prev => ({ ...prev, profile: null }));
                  }}
                  disabled={isSubmitting}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className={styles.disabledInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Menu Permissions *</label>
            <div className={styles.permissionsGrid}>
              {permissionOptions.map(({ key, label, icon }) => (
                <label
                  key={key}
                  className={`${styles.permissionItem} ${formData.permissions.includes(key) ? styles.selected : ''
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(key)}
                    onChange={() => handlePermissionChange(key)}
                    className={styles.permissionCheckbox}
                    disabled={isSubmitting}
                  />
                  <span className={styles.permissionIcon}>{icon}</span>
                  <span className={styles.permissionLabel}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;