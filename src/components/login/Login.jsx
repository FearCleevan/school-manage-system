import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase/config';
import {
    FaUser, FaLock, FaCheckSquare, FaSpinner,
    FaExclamationCircle, FaUserGraduate, FaClipboardCheck,
    FaChartBar, FaMoneyBillWave
} from 'react-icons/fa';
import './login.css';

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
    const navigate = useNavigate();

    // Load remembered email on mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

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
        <div className="spcd-login-container">
            <div className="login-page-header">
                <img src="school-logo.png" alt="School Logo" className="spcd-school-logo" />
                <h1>Samson Polytechnic College of Davao - Admin Login</h1>
            </div>

            <div className="spcd-login-card">
                {!isRecoveryMode ? (
                    <div className="spcd-login-form-section">
                        <form className="spcd-login-form" onSubmit={handleLogin}>
                            {error && (
                                <div className="spcd-error-message">
                                    <FaExclamationCircle /> {error}
                                </div>
                            )}

                            <div className="spcd-form-group">
                                <div className="spcd-input-with-icon">
                                    <FaUser className="input-icon" />
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

                            <div className="spcd-form-group">
                                <div className="spcd-input-with-icon">
                                    <FaLock className="input-icon" />
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

                            <div className="spcd-remember-me">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    <span className="checkmark"><FaCheckSquare /></span>
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="spcd-login-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="spinner" /> Logging in...
                                    </>
                                ) : 'Log in'}
                            </button>

                            <p className="spcd-forgot-password" onClick={handleForgotPassword}>
                                Forgot Password?
                            </p>
                        </form>
                    </div>
                ) : (
                    <div className="spcd-login-form-section">
                        <form className="spcd-recovery-form" onSubmit={handlePasswordRecovery}>
                            <h2>Account Recovery</h2>
                            <p>Enter your email address to recover your account.</p>

                            {error && (
                                <div className="spcd-error-message">
                                    <FaExclamationCircle /> {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="spcd-success-message">
                                    {successMessage}
                                </div>
                            )}

                            <div className="spcd-form-group">
                                <div className="spcd-input-with-icon">
                                    <FaUser className="input-icon" />
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
                                className="spcd-login-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="spinner" /> Sending...
                                    </>
                                ) : 'Submit'}
                            </button>

                            <p className="spcd-back-to-login" onClick={handleBackToLogin}>
                                Back to Login
                            </p>
                        </form>
                    </div>
                )}

                {!isRecoveryMode && (
                    <div className="spcd-features-section">
                        <div className="spcd-features-header">
                            <h2>School Management System</h2>
                        </div>

                        <ul className="spcd-features-list">
                            <li>
                                <FaUserGraduate className="feature-icon" />
                                <div>
                                    <strong>Student Enrollment</strong>
                                </div>
                            </li>
                            <li>
                                <FaClipboardCheck className="feature-icon" />
                                <div>
                                    <strong>Attendance Management</strong>
                                </div>
                            </li>
                            <li>
                                <FaChartBar className="feature-icon" />
                                <div>
                                    <strong>Grading System</strong>
                                </div>
                            </li>
                            <li>
                                <FaMoneyBillWave className="feature-icon" />
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