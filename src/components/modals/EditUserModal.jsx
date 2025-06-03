import React, { useState, useEffect, useRef } from 'react';
import {
  FaTimes, FaUserCircle, FaUpload,
  FaHome, FaGraduationCap, FaBuilding,
  FaBook, FaClipboardList, FaMoneyBillWave,
  FaChartLine, FaCalendarCheck, FaBell,
  FaShieldAlt, FaCog
} from 'react-icons/fa';
import './editUserModal.css';

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
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        throw new Error('First name and last name are required');
      }

      if (formData.permissions.length === 0) {
        throw new Error('At least one permission must be selected');
      }

      // Prepare user data for saving
      const userToSave = {
        id: formData.id,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        status: formData.status,
        permissions: formData.permissions
      };

      // Handle profile image
      if (typeof formData.profile === 'object') {
        // New image file was uploaded
        userToSave.profileImageFile = formData.profile;
      } else if (formData.profile) {
        // Existing image URL
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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Edit User Profile</h3>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Profile Image Upload */}
          <div className="profile-upload-container">
            <div className="profile-image-preview">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="profile-preview"
                />
              ) : (
                <FaUserCircle className="default-profile-icon" />
              )}
            </div>
            <div className="upload-controls">
              <button
                type="button"
                className="upload-btn"
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
                  className="remove-btn"
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

          {/* Name Fields */}
          <div className="form-row">
            <div className="form-group">
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
            <div className="form-group">
              <label>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
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
          </div>

          {/* Email (disabled) */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className="disabled-input"
            />
          </div>

          {/* Status */}
          <div className="form-group">
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

          {/* Permissions */}
          <div className="form-group">
            <label>Menu Permissions *</label>
            <div className="permissions-grid">
              {permissionOptions.map(({ key, label, icon }) => (
                <label
                  key={key}
                  className={`permission-item ${formData.permissions.includes(key) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(key)}
                    onChange={() => handlePermissionChange(key)}
                    className="permission-checkbox"
                    disabled={isSubmitting}
                  />
                  <span className="permission-icon">{icon}</span>
                  <span className="permission-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
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