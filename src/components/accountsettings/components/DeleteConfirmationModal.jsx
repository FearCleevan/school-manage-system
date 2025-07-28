//src/components/accountsettings/components/DeleteConfirmationModal.jsx
import React from 'react';
import '../accountUserSettings.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirm Deletion</h3>
        <p>
          Are you sure you want to delete {user?.firstName} {user?.lastName}?
          <br />
          Email: {user?.email}
        </p>
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;