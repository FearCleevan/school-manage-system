import React, { useState, useRef, useEffect } from 'react';
import styles from './EnrollModal.module.css';
import { db, auth } from '../../../lib/firebase/config';
import { logActivity } from '../../../lib/firebase/activityLogger';
import { doc, runTransaction, collection, addDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../../lib/firebase/storage';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EnrollModal = ({ show, onClose }) => {
    const [formData, setFormData] = useState({
        department: '',
        lrn: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        address: '',
        province: '',
        zipCode: '',
        city: '',
        emergencyName: '',
        emergencyContact: '',
        emergencyRelation: '',
        profilePhoto: null
    });

    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [generatedId, setGeneratedId] = useState('Generating...');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const departments = [
        { value: '', label: 'Select Department' },
        { value: 'college', label: 'College' },
        { value: 'tvet', label: 'TVET' },
        { value: 'shs', label: 'Senior High School (SHS)' },
        { value: 'jhs', label: 'Junior High School (JHS)' }
    ];

    const relations = [
        { value: '', label: 'Select Relation' },
        { value: 'father', label: 'Father' },
        { value: 'mother', label: 'Mother' },
        { value: 'sister', label: 'Sister' },
        { value: 'brother', label: 'Brother' },
        { value: 'guardian', label: 'Guardian' }
    ];

    // Generate sequential student ID
    useEffect(() => {
        const generateSequentialId = async () => {
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const prefix = `SPC${currentYear}-`;

            try {
                const counterRef = doc(db, 'counters', 'studentIds');
                const newId = await runTransaction(db, async (transaction) => {
                    const counterDoc = await transaction.get(counterRef);
                    let lastNumber = counterDoc.exists() ? (counterDoc.data().lastNumber || 0) : 0;
                    const newNumber = lastNumber + 1;
                    transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });
                    return `${prefix}${newNumber.toString().padStart(4, '0')}`;
                });
                setGeneratedId(newId);
            } catch (error) {
                console.error('ID generation error:', error);
                const fallbackNum = Date.now().toString().slice(-4);
                setGeneratedId(`${prefix}${fallbackNum}`);
            }
        };

        if (show) {
            generateSequentialId();
        } else {
            setGeneratedId('Generating...');
        }
    }, [show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                alert('Please select an image file (jpg, png, etc.)');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewPhoto(reader.result);
                setFormData(prev => ({
                    ...prev,
                    profilePhoto: file
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setPreviewPhoto(null);
        setFormData(prev => ({
            ...prev,
            profilePhoto: null
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!auth.currentUser) {
            toast.error('Please sign in to enroll students', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const requiredFields = [
                'department', 'firstName', 'lastName', 'email',
                'phone', 'username', 'password', 'address',
                'province', 'city', 'zipCode', 'emergencyName',
                'emergencyContact', 'emergencyRelation'
            ];

            const missingFields = requiredFields.filter(field => !formData[field]);
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            if ((formData.department === 'shs' || formData.department === 'jhs') && !formData.lrn) {
                throw new Error('LRN is required for SHS/JHS students');
            }

            let photoURL = null;
            if (formData.profilePhoto) {
                try {
                    const cloudinaryResponse = await uploadToCloudinary(formData.profilePhoto);
                    photoURL = cloudinaryResponse?.secure_url || null;
                    toast.info('Profile photo uploaded successfully', {
                        position: "top-right",
                        autoClose: 2000,
                    });
                } catch (error) {
                    console.error('Photo upload failed:', error);
                    toast.warn('Profile photo upload failed, continuing without photo', {
                        position: "top-right",
                        autoClose: 3000,
                    });
                }
            }

            const studentData = {
                studentId: generatedId,
                department: formData.department,
                lrn: formData.lrn || null,
                firstName: formData.firstName.trim(),
                middleName: formData.middleName?.trim() || null,
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                phone: formData.phone.trim(),
                username: formData.username.toLowerCase().trim(),
                password: formData.password,
                address: {
                    street: formData.address.trim(),
                    province: formData.province.trim(),
                    city: formData.city.trim(),
                    zipCode: formData.zipCode.trim()
                },
                emergencyContact: {
                    name: formData.emergencyName.trim(),
                    phone: formData.emergencyContact.trim(),
                    relation: formData.emergencyRelation
                },
                profilePhoto: photoURL,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active',
                isVerified: false,
                academicStatus: 'enrolled',
                enrolledBy: auth.currentUser.uid
            };

            await addDoc(collection(db, 'students'), studentData);

            logActivity('added a new student', {
                studentId: generatedId,
                studentName: `${formData.firstName} ${formData.lastName}`
            }, auth.currentUser.displayName);

            toast.success(`Student ${generatedId} enrolled successfully!`, {
                position: "top-right",
                autoClose: 4000,
            });

            resetForm();
            onClose();
        } catch (error) {
            console.error('Enrollment error:', error);
            toast.error(error.message || 'Failed to enroll student. Please try again.', {
                position: "top-right",
                autoClose: 4000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            department: '',
            lrn: '',
            firstName: '',
            middleName: '',
            lastName: '',
            email: '',
            phone: '',
            username: '',
            password: '',
            address: '',
            province: '',
            zipCode: '',
            city: '',
            emergencyName: '',
            emergencyContact: '',
            emergencyRelation: '',
            profilePhoto: null
        });
        setPreviewPhoto(null);
        setGeneratedId('Generating...');
    };

    if (!show) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.enrollModal} ${styles.scaledModal}`}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Enroll New Student</h2>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.enrollForm}>
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Academic Information</h3>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="studentId" className={styles.formLabel}>Student ID</label>
                                <input
                                    id="studentId"
                                    type="text"
                                    value={generatedId}
                                    disabled
                                    className={`${styles.formInput} ${styles.disabledInput}`}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="department" className={styles.formLabel}>Department *</label>
                                <select
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={`${styles.formInput} ${styles.formSelect}`}
                                >
                                    {departments.map(dept => (
                                        <option key={dept.value} value={dept.value}>
                                            {dept.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {(formData.department === 'shs' || formData.department === 'jhs') && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="lrn" className={styles.formLabel}>LRN *</label>
                                    <input
                                        id="lrn"
                                        type="text"
                                        name="lrn"
                                        value={formData.lrn}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        pattern="[0-9]{12}"
                                        title="LRN must be 12 digits"
                                        className={styles.formInput}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Personal Details</h3>
                        <div className={styles.profilePhotoContainer}>
                            <div className={styles.profilePhotoWrapper}>
                                {previewPhoto ? (
                                    <>
                                        <img src={previewPhoto} alt="Profile Preview" className={styles.profilePhoto} />
                                        <button
                                            type="button"
                                            className={styles.removePhotoBtn}
                                            onClick={handleRemovePhoto}
                                            disabled={isSubmitting}
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.profilePhotoPlaceholder}>
                                            <img
                                                src="/default-user.png"
                                                alt="Default user"
                                                className={styles.defaultUserImage}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.selectPhotoBtn}
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={isSubmitting}
                                        >
                                            Select Photo
                                        </button>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="firstName" className={styles.formLabel}>First Name *</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="middleName" className={styles.formLabel}>Middle Name</label>
                                <input
                                    id="middleName"
                                    type="text"
                                    name="middleName"
                                    value={formData.middleName}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="lastName" className={styles.formLabel}>Last Name *</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.formLabel}>Email Address *</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="phone" className={styles.formLabel}>Cellphone Number *</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    pattern="[0-9]{11}"
                                    title="Phone number must be 11 digits"
                                    className={styles.formInput}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.formLabel}>Username *</label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    minLength="4"
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="password" className={styles.formLabel}>Password *</label>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    minLength="6"
                                    className={styles.formInput}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Address Information</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="address" className={styles.formLabel}>Present Address *</label>
                            <input
                                id="address"
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                                className={styles.formInput}
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="province" className={styles.formLabel}>Province *</label>
                                <input
                                    id="province"
                                    type="text"
                                    name="province"
                                    value={formData.province}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="city" className={styles.formLabel}>City *</label>
                                <input
                                    id="city"
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="zipCode" className={styles.formLabel}>ZIP Code *</label>
                                <input
                                    id="zipCode"
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    pattern="[0-9]{4}"
                                    title="ZIP code must be 4 digits"
                                    className={styles.formInput}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Emergency Contact</h3>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="emergencyName" className={styles.formLabel}>Full Name *</label>
                                <input
                                    id="emergencyName"
                                    type="text"
                                    name="emergencyName"
                                    value={formData.emergencyName}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="emergencyContact" className={styles.formLabel}>Contact Number *</label>
                                <input
                                    id="emergencyContact"
                                    type="tel"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    pattern="[0-9]{11}"
                                    title="Phone number must be 11 digits"
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="emergencyRelation" className={styles.formLabel}>Relationship *</label>
                                <select
                                    id="emergencyRelation"
                                    name="emergencyRelation"
                                    value={formData.emergencyRelation}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isSubmitting}
                                    className={`${styles.formInput} ${styles.formSelect}`}
                                >
                                    {relations.map(rel => (
                                        <option key={rel.value} value={rel.value}>
                                            {rel.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
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
                            {isSubmitting ? 'Enrolling...' : 'Submit Enrollment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnrollModal;