import React from 'react';
import styles from './ConfirmationModal.module.css';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ConfirmationModal = ({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  loading, 
  error 
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onCancel} disabled={loading}>
            <FaTimes />
          </button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.warningIcon}>
            <FaExclamationTriangle />
          </div>
          <p>{message}</p>
          {error && <div className={styles.error}>{error}</div>}
        </div>
        <div className={styles.modalFooter}>
          <button 
            onClick={onCancel} 
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={styles.confirmButton}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;