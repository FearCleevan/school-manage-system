import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../../../lib/firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import {
    FaTimes, FaUserCircle, FaUpload,
    FaHome, FaGraduationCap, FaBuilding,
    FaBook, FaClipboardList, FaMoneyBillWave,
    FaChartLine, FaCalendarCheck, FaBell,
    FaShieldAlt, FaCog, FaEye, FaEyeSlash
} from 'react-icons/fa';
import styles from './EditUserModal.module.css';
import { logUserActivity } from '../../../lib/firebase/userActivityLogger';

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

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordErrors, setPasswordErrors] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handlePermissionChange = (permissionKey) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionKey)
                ? prev.permissions.filter(p => p !== permissionKey)
                : [...prev.permissions, permissionKey]
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validatePasswords = () => {
        let isValid = true;
        const newErrors = {
            current: '',
            new: '',
            confirm: ''
        };

        if (isPasswordSectionOpen) {
            if (!passwordData.currentPassword) {
                newErrors.current = 'Current password is required';
                isValid = false;
            }

            if (!passwordData.newPassword) {
                newErrors.new = 'New password is required';
                isValid = false;
            } else if (passwordData.newPassword.length < 8) {
                newErrors.new = 'Password must be at least 8 characters';
                isValid = false;
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                newErrors.confirm = 'Passwords do not match';
                isValid = false;
            }
        }

        setPasswordErrors(newErrors);
        return isValid;
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Basic form validation
            if (!formData.firstName || !formData.lastName) {
                throw new Error('First name and last name are required');
            }

            if (formData.permissions.length === 0) {
                throw new Error('At least one permission must be selected');
            }

            // Password validation if password section is open
            if (isPasswordSectionOpen) {
                if (!validatePasswords()) {
                    return;
                }

                await logUserActivity('user_password_changed', {
                    userId: formData.id
                });
            }

            const userToSave = {
                id: formData.id,
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                status: formData.status,
                permissions: formData.permissions
            };

            // Handle password update if password section is open
            if (isPasswordSectionOpen) {
                try {
                    const currentUser = auth.currentUser;

                    if (!currentUser) {
                        throw new Error('User not authenticated. Please log in again.');
                    }

                    // Create credentials for reauthentication
                    const credential = EmailAuthProvider.credential(
                        currentUser.email,
                        passwordData.currentPassword
                    );

                    // Reauthenticate user
                    await reauthenticateWithCredential(currentUser, credential);

                    // Update password
                    await updatePassword(currentUser, passwordData.newPassword);

                    // Clear password fields after successful update
                    setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    });
                } catch (passwordError) {
                    let errorMessage = 'Failed to update password';
                    switch (passwordError.code) {
                        case 'auth/wrong-password':
                            errorMessage = 'Current password is incorrect';
                            break;
                        case 'auth/weak-password':
                            errorMessage = 'New password should be at least 6 characters';
                            break;
                        case 'auth/requires-recent-login':
                            errorMessage = 'Session expired. Please log in again to change your password.';
                            break;
                        default:
                            errorMessage = passwordError.message || 'Password update failed';
                    }
                    throw new Error(errorMessage);
                }
            }

            // Handle profile image update
            if (typeof formData.profile === 'object') {
                // New image uploaded - will be handled by parent component
                userToSave.profileImageFile = formData.profile;
            } else if (formData.profile) {
                // Existing image URL
                userToSave.photoURL = formData.profile;
            }

            // Save user data (parent component handles Firestore update)
            await onSave(userToSave);

            // Close modal on success
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

                    {/* Change Password Section */}
                    <div className={styles.passwordSection}>
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
                        >
                            {isPasswordSectionOpen ? 'Hide Password Change' : 'Change Password'}
                        </button>

                        {isPasswordSectionOpen && (
                            <div className={styles.passwordFields}>
                                <div className={styles.formGroup}>
                                    <label>Current Password *</label>
                                    <div className={styles.passwordInputContainer}>
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggleBtn}
                                            onClick={() => togglePasswordVisibility('current')}
                                        >
                                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {passwordErrors.current && (
                                        <div className={styles.errorMessage}>{passwordErrors.current}</div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>New Password *</label>
                                    <div className={styles.passwordInputContainer}>
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            minLength="8"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggleBtn}
                                            onClick={() => togglePasswordVisibility('new')}
                                        >
                                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {passwordErrors.new && (
                                        <div className={styles.errorMessage}>{passwordErrors.new}</div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Confirm New Password *</label>
                                    <div className={styles.passwordInputContainer}>
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            minLength="8"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggleBtn}
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        >
                                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {passwordErrors.confirm && (
                                        <div className={styles.errorMessage}>{passwordErrors.confirm}</div>
                                    )}
                                </div>
                            </div>
                        )}
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