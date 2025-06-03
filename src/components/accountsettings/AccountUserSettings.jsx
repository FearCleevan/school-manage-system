import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    FaUserPlus, FaUserEdit, FaUserShield, FaSearch, FaEye,
    FaFileExport, FaFileImport, FaCalendarCheck, FaBook,
    FaChartLine, FaCog, FaHome, FaQuestionCircle, FaBell,
    FaMoneyBillWave, FaClipboardList, FaBuilding, FaGraduationCap, FaShieldAlt
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import { auth, db } from '../../lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import CreateUserModal from '../modals/CreateUserModal';
import EditUserModal from '../modals/EditUserModal';
import ViewUserModal from '../modals/ViewUserModal';
import './AccountUserSettings.css';

const AccountUserSettings = () => {
    // State management
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('admin', 'teacher');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Permission icons mapping
    const permissionIcons = {
        dashboard: <FaHome />,
        manageStudent: <FaGraduationCap />,
        department: <FaBuilding />,
        course: <FaBook />,
        subjects: <FaClipboardList />,
        payment: <FaMoneyBillWave />,
        gradingSystem: <FaChartLine />,
        attendance: <FaCalendarCheck />,
        announcement: <FaBell />,
        accountPermission: <FaShieldAlt />,
        accountSettings: <FaCog />,
    };

    const permissionLabels = {
        dashboard: "Dashboard",
        manageStudent: "Student Management",
        department: "Department",
        course: "Course",
        subjects: "Subjects",
        payment: "Payment Management",
        gradingSystem: "Grading System",
        attendance: "Attendance",
        announcement: "Announcement",
        accountPermission: "Account Permission",
        accountSettings: "Account & User Settings"
    };

    // Fetch users with real-time updates
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                setLoading(false);
                setError('Authentication required');
                return;
            }

            try {
                // Query users based on role if not admin
                const usersQuery = currentUser?.role === 'admin'
                    ? query(collection(db, 'users'))
                    : query(collection(db, 'users'), where('role', '==', activeTab));

                const unsubscribeFirestore = onSnapshot(
                    usersQuery,
                    (snapshot) => {
                        const usersData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setUsers(usersData);
                        setLoading(false);
                        setError(null);
                    },
                    (error) => {
                        console.error("Firestore error:", error);
                        setError('Failed to load users');
                        setLoading(false);
                    }
                );

                return () => unsubscribeFirestore();
            } catch (err) {
                console.error("Error setting up listener:", err);
                setError('Error initializing data');
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, [activeTab, currentUser?.role]);

    // Filter users based on active tab and search term
    const filteredUsers = users.filter(user =>
        user.role === activeTab &&
        (
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: Scroll to top on page change
    };

    // Handler functions
    const handleCreateUser = () => {
        setShowCreateModal(false);
    };

    const handleSaveUser = async (updatedUser) => {
        try {
            if (!updatedUser?.id) {
                throw new Error('Invalid user data: Missing ID');
            }

            const userRef = doc(db, 'users', updatedUser.id);
            const updateData = {
                firstName: updatedUser.firstName,
                middleName: updatedUser.middleName || null,
                lastName: updatedUser.lastName,
                status: updatedUser.status,
                permissions: updatedUser.permissions || [],
                lastUpdated: new Date().toISOString()
            };

            if (updatedUser.profileImageFile) {
                try {
                    const formData = new FormData();
                    formData.append('file', updatedUser.profileImageFile);
                    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                    formData.append('public_id', `user_profile_${updatedUser.id}_${uuidv4()}`);

                    const response = await fetch(
                        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                        {
                            method: 'POST',
                            body: formData,
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Failed to upload profile image to Cloudinary');
                    }

                    const data = await response.json();
                    updateData.photoURL = data.secure_url;
                } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                    throw new Error('Failed to upload profile image');
                }
            } else if (updatedUser.photoURL) {
                updateData.photoURL = updatedUser.photoURL;
            }

            await updateDoc(userRef, updateData);
            setSuccessMessage('User updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Detailed error:", error);
            setError(`Update failed: ${error.message}`);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            setError('Failed to update user status');
        }
    };

    const handleImport = () => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const lines = content.split('\n');
                const importedUsers = lines.slice(1).map(line => {
                    const values = line.split(',');
                    return {
                        id: values[0] || Math.random().toString(36).substring(2, 9),
                        firstName: values[1] || '',
                        lastName: values[2] || '',
                        email: values[3] || '',
                        role: values[4] || 'admin',
                        status: values[5] || 'active',
                        permissions: values[6] ? values[6].split(',') : [],
                        lastLogin: values[7] || new Date().toISOString(),
                        profile: values[8] || '/default-profile.png'
                    };
                });
                setUsers(prev => [...prev, ...importedUsers]);
            } catch (err) {
                console.error("Error parsing CSV:", err);
                setError('Invalid CSV format');
            } finally {
                setFile(null);
            }
        };
        reader.readAsText(file);
    };

    // Render loading or error states
    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentUser) {
        return <div className="auth-message">Please sign in to view this page</div>;
    }

    return (
        <div className="account-user-settings">
            <h2 className="settings-header">Account & User Management</h2>

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button
                    className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('admin'); setCurrentPage(1); }}
                >
                    <FaUserShield /> Admin Accounts
                </button>
                <button
                    className={`tab-btn ${activeTab === 'teacher' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('teacher'); setCurrentPage(1); }}
                >
                    <FaUserEdit /> Teacher Accounts
                </button>
            </div>

            {/* Table Controls */}
            <div className="table-controls">
                <div className="left-controls">
                    <div className="search-bar">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className="create-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FaUserPlus /> Create New User
                    </button>
                </div>

                <div className="right-controls">
                    <div className="items-per-page">
                        <span>Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[5, 10, 20, 50, 100].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="import-export-buttons">
                        <label className="import-btn">
                            <FaFileImport />
                            <span>Import</span>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setFile(e.target.files[0])}
                                style={{ display: 'none' }}
                            />
                        </label>
                        {file && (
                            <button className="confirm-import-btn" onClick={handleImport}>
                                Confirm Import
                            </button>
                        )}
                        <CSVLink
                            data={users.map(user => ({
                                ...user,
                                permissions: user.permissions?.join(', ') || ''
                            }))}
                            headers={[
                                { label: "ID", key: "id" },
                                { label: "First Name", key: "firstName" },
                                { label: "Last Name", key: "lastName" },
                                { label: "Email", key: "email" },
                                { label: "Role", key: "role" },
                                { label: "Status", key: "status" },
                                { label: "Permissions", key: "permissions" }
                            ]}
                            filename="users-export.csv"
                            className="export-btn"
                        >
                            <FaFileExport />
                            <span>Export</span>
                        </CSVLink>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Profile</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Permissions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>
                                    <img
                                        src={user.photoURL || '/default-profile.png'}
                                        alt="Profile"
                                        className="profile-image"
                                    />
                                </td>
                                <td>{user.firstName} {user.middleName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    <select
                                        value={user.status || 'active'}
                                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                        className="status-select"
                                        disabled={!currentUser || currentUser.role !== 'admin'}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </td>
                                <td>
                                    <div className="permission-icons-container">
                                        {/* Split permissions into chunks of 6 */}
                                        {user.permissions?.reduce((rows, permission, index) => {
                                            const chunkIndex = Math.floor(index / 6);
                                            if (!rows[chunkIndex]) {
                                                rows[chunkIndex] = [];
                                            }
                                            rows[chunkIndex].push(permission);
                                            return rows;
                                        }, []).map((row, rowIndex) => (
                                            <div key={rowIndex} className="permission-icons-row">
                                                {row.map(permission => (
                                                    <div
                                                        key={permission}
                                                        className="permission-icon"
                                                        title={permissionLabels[permission] || permission}
                                                    >
                                                        {permissionIcons[permission] || <FaQuestionCircle />}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setShowViewModal(true);
                                            }}
                                            className="view-btn"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setShowEditModal(true);
                                            }}
                                            className="edit-btn"
                                        >
                                            <FaUserEdit />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <div className="pagination-info">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
                    </div>
                    <div className="pagination-buttons">
                        <button
                            onClick={() => paginate(1)}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                            aria-label="First page"
                        >
                            First
                        </button>
                        <button
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                            aria-label="Previous page"
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => paginate(pageNum)}
                                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                    aria-label={`Page ${pageNum}`}
                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                            aria-label="Next page"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => paginate(totalPages)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                            aria-label="Last page"
                        >
                            Last
                        </button>
                    </div>
                </div>
            )}
            {/* Modals */}
            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateUser}
            />
            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={selectedUser}
                onSave={handleSaveUser}
            />
            <ViewUserModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                user={selectedUser}
            />
        </div>
    );
};

export default AccountUserSettings;