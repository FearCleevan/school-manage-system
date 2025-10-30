import React, { useState, useRef } from 'react';
import {
  FaTimes, FaUserCircle, FaUpload,
  FaHome, FaGraduationCap, FaBuilding,
  FaBook, FaClipboardList, FaMoneyBillWave,
  FaChartLine, FaCalendarCheck, FaBell,
  FaShieldAlt, FaCog
} from 'react-icons/fa';
import { auth } from '../../../lib/firebase/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { uploadToCloudinary } from '../../../lib/firebase/storage';
import styles from './CreateUserModal.module.css';
import { logUserActivity } from '../../../lib/firebase/userActivityLogger';

const CreateUserModal = ({ isOpen, onClose, onCreate, currentUser }) => {
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

  const resetForm = () => {
    setFormData({
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
    setPreviewImage(null);
    setError('');
    setPasswordError('');
  };

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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const reauthenticateCurrentUser = async (currentUser, currentPassword) => {
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      return true;
    } catch (error) {
      console.error('Reauthentication failed:', error);
      throw new Error('Current password is incorrect');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    // Form validation
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

    // Prevent creating a user with the same email as the current user
    if (currentUser && formData.email === currentUser.email) {
      setError('Cannot create a user with the same email as the currently logged-in user');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload profile image if exists
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

      // Store current user reference before creating new user
      const originalUser = auth.currentUser;
      
      if (!originalUser) {
        throw new Error('No user is currently logged in');
      }

      // 2. Create auth user
      const { user: authUser } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 3. Create user document in Firestore
      const userDocRef = doc(db, 'users', authUser.uid);
      await setDoc(userDocRef, {
        uid: authUser.uid,
        firstName: formData.firstName,
        middleName: formData.middleName || null,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        permissions: formData.permissions,
        photoURL,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // 4. IMPORTANT: Re-authenticate as the original user
      // For admin users, we'll sign back in as the original admin
      // In a real app, you might want to ask for the admin's password again
      // For now, we'll sign out and let the auth context handle the redirect
      
      // Sign out the newly created user
      await auth.signOut();
      
      // The AuthContext will detect the sign-out and redirect to login
      // The admin will need to log in again

      try {
        // Log the activity before we lose the admin context
        await logUserActivity('user_created', {
          targetUserId: authUser.uid,
          targetUserEmail: formData.email,
          targetUserName: `${formData.firstName} ${formData.lastName}`,
          role: formData.role,
          status: formData.status
        });
      } catch (logError) {
        console.error("Activity logging failed:", logError);
      }

      // Success - show message that admin needs to log in again
      toast.success('User created successfully! Please log in again to continue.');
      
      // Reset form and close modal
      resetForm();
      onClose();
      
      // Call the onCreate callback
      onCreate();

    } catch (error) {
      console.error('Error in user creation process:', error);
      let errorMessage = 'Failed to create user account';

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
            errorMessage = `Error: ${error.code}`;
        }
      } else if (error.message.includes('Cloudinary')) {
        errorMessage = error.message;
      } else if (error.message.includes('password')) {
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
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
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
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="middleName">Middle Name</label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
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
              <label htmlFor="role">Role *</label>
              <select
                id="role"
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
              <label htmlFor="status">Status *</label>
              <select
                id="status"
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
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
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
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
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
                  className={`${styles.permissionItem} ${formData.permissions.includes(key) ? styles.selected : ''
                    }`}
                  htmlFor={`perm-${key}`}
                >
                  <input
                    type="checkbox"
                    id={`perm-${key}`}
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
              onClick={handleClose}
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