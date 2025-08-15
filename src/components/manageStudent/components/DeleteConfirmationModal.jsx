import React from 'react';
import '../studentManagement.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, student, isBulkDelete, students }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirm Deletion</h3>
        {isBulkDelete ? (
          <p>Are you sure you want to delete {students.length} selected students?</p>
        ) : (
          <>
            <p>Are you sure you want to delete {student?.firstName} {student?.lastName}?</p>
            <p>Student ID: {student?.studentId}</p>
          </>
        )}
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