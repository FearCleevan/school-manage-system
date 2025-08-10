import React from 'react';
import styles from './ExistingStudentEnroll.module.css';

const DeleteConfirmationModal = ({ 
  showDeleteModal, 
  setShowDeleteModal, 
  confirmDeleteRow 
}) => {
  if (!showDeleteModal) return null;

  return (
    <div className={styles.deleteModal}>
      <div className={styles.deleteModalContent}>
        <h4>Confirm Deletion</h4>
        <p>Are you sure you want to delete this subject?</p>
        <div className={styles.deleteModalActions}>
          <button
            className={styles.deleteModalCancel}
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </button>
          <button
            className={styles.deleteModalConfirm}
            onClick={confirmDeleteRow}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;