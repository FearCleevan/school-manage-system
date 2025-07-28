import React from 'react';
import '../subjects.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, subject }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirm Deletion</h3>
        <p>
          Are you sure you want to delete {subject?.subjectName}?
          <br />
          Subject ID: {subject?.subjectId}
        </p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;