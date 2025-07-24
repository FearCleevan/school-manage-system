//src/components/modals/CreateUserModal.jsx
import React, { useState, useRef } from 'react';
import {
  FaTimes, FaUserCircle, FaUpload,
  FaHome, FaGraduationCap, FaBuilding,
  FaBook, FaClipboardList, FaMoneyBillWave,
  FaChartLine, FaCalendarCheck, FaBell,
  FaShieldAlt, FaCog
} from 'react-icons/fa';
import { createAuthUser, createUserDocument } from '../../lib/firebase/auth';
import { uploadToCloudinary } from '../../lib/firebase/storage';
import styles from './CreateUserModal.module.css';

const CreateUserModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    profile: null,
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    role: 'admin',
    status: 'active',
    permissions: [],
    password: '',
    confirmPassword: ''
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [passwordError, setPasswordError] = useState('');
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
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

    if (name === 'confirmPassword') {
      setPasswordError(
        value !== formData.password ? "Passwords don't match!" : ''
      );
    }
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
    setError('');
    setPasswordError('');

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords don't match!");
      return;
    }

    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoURL = null;
      if (formData.profile) {
        try {
          const result = await uploadToCloudinary(formData.profile);
          if (!result.secure_url) {
            throw new Error('No URL returned from Cloudinary');
          }
          photoURL = result.secure_url;
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          throw new Error(`Profile image upload failed: ${uploadError.message}`);
        }
      }

      const authUser = await createAuthUser(formData.email, formData.password);

      const userData = {
        firstName: formData.firstName,
        middleName: formData.middleName || null,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        permissions: formData.permissions,
        photoURL,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      await createUserDocument(authUser, userData);
      onCreate();
      onClose();
    } catch (error) {
      console.error('Error in user creation process:', error);
      let errorMessage = 'Failed to complete account creation';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 8 characters';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Account creation is currently disabled';
            break;
          default:
            errorMessage = `Authentication error: ${error.code}`;
        }
      } else if (error.message.includes('Cloudinary')) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>Create New User</h3>
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
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                placeholder="At least 8 characters"
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="8"
                disabled={isSubmitting}
              />
              {passwordError && (
                <div className={styles.errorMessage}>{passwordError}</div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Menu Permissions</label>
            <div className={styles.permissionsGrid}>
              {permissionOptions.map(({ key, label, icon }) => (
                <label
                  key={key}
                  className={`${styles.permissionItem} ${
                    formData.permissions.includes(key) ? styles.selected : ''
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
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;