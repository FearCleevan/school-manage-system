//src/components/login/Login.jsx
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase/config';
import {
    FaUser, FaLock, FaCheckSquare, FaSpinner,
    FaExclamationCircle, FaUserGraduate, FaClipboardCheck,
    FaChartBar, FaMoneyBillWave
} from 'react-icons/fa';
import styles from './Login.module.css';

const Login = () => {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setFormData(prev => ({ 
                ...prev, 
                email: rememberedEmail, 
                rememberMe: true 
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { email, password, rememberMe } = formData;

        if (!email || !password) {
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        try {
            // First ensure the auth state is cleared
            await auth.signOut();

            // Then perform the login
            await signInWithEmailAndPassword(auth, email, password);

            // Store email if remember me is checked
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Force a complete refresh to ensure auth state is properly initialized
            window.location.href = '/dashboard';

        } catch (err) {
            console.error('Login error:', err);
            let errorMessage = 'Login failed. Please try again.';

            switch (err.code) {
                case 'auth/invalid-email': errorMessage = 'Invalid email address'; break;
                case 'auth/user-disabled': errorMessage = 'Account disabled'; break;
                case 'auth/user-not-found': errorMessage = 'No account found'; break;
                case 'auth/wrong-password': errorMessage = 'Incorrect password'; break;
                case 'auth/too-many-requests':
                    errorMessage = 'Account temporarily locked due to too many attempts';
                    break;
                default: errorMessage = 'Login failed. Please try again.';
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    const handlePasswordRecovery = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, formData.email);
            setSuccessMessage(`Password reset sent to ${formData.email}`);
            setError('');
        } catch (err) {
            console.error('Recovery error:', err);
            setError(err.message || 'Failed to send reset email');
            setSuccessMessage('');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setIsRecoveryMode(true);
        setError('');
        setSuccessMessage('');
    };

    const handleBackToLogin = () => {
        setIsRecoveryMode(false);
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginPageHeader}>
                <img src="school-logo.png" alt="School Logo" className={styles.schoolLogo} />
                <h1>Samson Polytechnic College of Davao - Admin Login</h1>
            </div>

            <div className={styles.loginCard}>
                {!isRecoveryMode ? (
                    <div className={styles.loginFormSection}>
                        <form className={styles.loginForm} onSubmit={handleLogin}>
                            {error && (
                                <div className={styles.errorMessage}>
                                    <FaExclamationCircle /> {error}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <div className={styles.inputWithIcon}>
                                    <FaUser className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <div className={styles.inputWithIcon}>
                                    <FaLock className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete={formData.rememberMe ? "current-password" : "off"}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.rememberMe}>
                                <label>
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    <span className={styles.checkmark}><FaCheckSquare /></span>
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                className={styles.loginButton}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className={styles.spinner} /> Logging in...
                                    </>
                                ) : 'Log in'}
                            </button>

                            <p className={styles.forgotPassword} onClick={handleForgotPassword}>
                                Forgot Password?
                            </p>
                        </form>
                    </div>
                ) : (
                    <div className={styles.loginFormSection}>
                        <form className={styles.recoveryForm} onSubmit={handlePasswordRecovery}>
                            <h2>Account Recovery</h2>
                            <p>Enter your email address to recover your account.</p>

                            {error && (
                                <div className={styles.errorMessage}>
                                    <FaExclamationCircle /> {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className={styles.successMessage}>
                                    {successMessage}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <div className={styles.inputWithIcon}>
                                    <FaUser className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.loginButton}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className={styles.spinner} /> Sending...
                                    </>
                                ) : 'Submit'}
                            </button>

                            <p className={styles.backToLogin} onClick={handleBackToLogin}>
                                Back to Login
                            </p>
                        </form>
                    </div>
                )}

                {!isRecoveryMode && (
                    <div className={styles.featuresSection}>
                        <div className={styles.featuresHeader}>
                            <h2>School Management System</h2>
                        </div>

                        <ul className={styles.featuresList}>
                            <li>
                                <FaUserGraduate className={styles.featureIcon} />
                                <div>
                                    <strong>Student Enrollment</strong>
                                </div>
                            </li>
                            <li>
                                <FaClipboardCheck className={styles.featureIcon} />
                                <div>
                                    <strong>Attendance Management</strong>
                                </div>
                            </li>
                            <li>
                                <FaChartBar className={styles.featureIcon} />
                                <div>
                                    <strong>Grading System</strong>
                                </div>
                            </li>
                            <li>
                                <FaMoneyBillWave className={styles.featureIcon} />
                                <div>
                                    <strong>Payment Management</strong>
                                </div>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;