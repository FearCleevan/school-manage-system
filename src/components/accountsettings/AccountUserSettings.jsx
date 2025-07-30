// src/components/accountsettings/AccountUserSettings.jsx
import React, { useState, useEffect } from 'react';
import { FaUserShield, FaUserEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../../lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { logUserActivity } from '../../lib/activityLogger';

import './accountUserSettings.css';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import UsersTable from './components/UsersTable';
import TableControls from './components/TableControls';
import { useUsersData } from './hooks/useUsersData';
import CreateUserModal from '../modals/CreateUserModal';
import EditUserModal from '../modals/EditUserModal';
import ViewUserModal from '../modals/ViewUserModal';

const AccountUserSettings = () => {
    // State management
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('admin');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Custom hooks
    const { users, loading, error, setUsers } = useUsersData(activeTab, currentUser);

    // Filter users based on search term
    const [searchTerm, setSearchTerm] = useState('');
    const filteredUsers = users.filter(user =>
        !searchTerm.trim() ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle current user authentication
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    // Handler functions
    const handleCreateUser = async (newUser) => {
        try {
            await logUserActivity('user_created', newUser);
            setShowCreateModal(false);
            toast.success('User created successfully!');
        } catch (error) {
            console.error("Error logging user creation:", error);
            toast.error('User created but activity log failed');
        }
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

            // Only process image if there's a new file
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
            await logUserActivity('user_updated', updatedUser);
            toast.success('User updated successfully!');
            return true;
        } catch (error) {
            console.error("Detailed error:", error);
            toast.error(`Update failed: ${error.message}`);
            return false;
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { status: newStatus });
            
            // Find the user to log the activity
            const user = users.find(u => u.id === userId);
            if (user) {
                await logUserActivity('user_updated', { 
                    ...user, 
                    status: newStatus 
                });
            }
            
            toast.success(`User status changed to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error('Failed to update user status');
        }
    };

    const handleDeleteUser = async () => {
        try {
            if (!selectedUser?.id) {
                throw new Error('No user selected for deletion');
            }
            await logUserActivity('user_deleted', selectedUser);
            await deleteDoc(doc(db, 'users', selectedUser.id));
            setShowDeleteModal(false);
            setSelectedUser(null);
            toast.success('User deleted successfully!');
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error(`Failed to delete user: ${error.message}`);
        }
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
            <TableControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                onAddUser={() => setShowCreateModal(true)}
                users={users}
            />

            {/* Users Table */}
            <UsersTable
                users={currentItems}
                currentUser={currentUser}
                onViewUser={(user) => {
                    setSelectedUser(user);
                    setShowViewModal(true);
                }}
                onEditUser={(user) => {
                    setSelectedUser(user);
                    setShowEditModal(true);
                }}
                onDeleteUser={(user) => {
                    setSelectedUser(user);
                    setShowDeleteModal(true);
                }}
                onStatusChange={handleStatusChange}
            />

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
                        >
                            First
                        </button>
                        <button
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
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
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => paginate(totalPages)}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
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

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteUser}
                user={selectedUser}
            />
        </div>
    );
};

export default AccountUserSettings;