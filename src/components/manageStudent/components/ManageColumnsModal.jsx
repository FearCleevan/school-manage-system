// src/components/manageStudent/components/ManageColumnsModal.jsx
import React, { useState } from 'react';
import styles from './ManageColumns.module.css';

const ManageColumnsModal = ({ 
  isOpen, 
  onClose, 
  columns, 
  visibleColumns, 
  setVisibleColumns 
}) => {
  const [localVisibleColumns, setLocalVisibleColumns] = useState([...visibleColumns]);

  const handleToggleColumn = (columnKey) => {
    if (localVisibleColumns.includes(columnKey)) {
      setLocalVisibleColumns(localVisibleColumns.filter(col => col !== columnKey));
    } else {
      setLocalVisibleColumns([...localVisibleColumns, columnKey]);
    }
  };

  const handleReset = () => {
    setLocalVisibleColumns(columns.map(col => col.key));
  };

  const handleApply = () => {
    setVisibleColumns(localVisibleColumns);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.modalHeader}>Manage Columns</h3>
        <div className={styles.columnsList}>
          {columns.map((column) => (
            <div key={column.key} className={styles.columnItem}>
              <label>
                <input
                  type="checkbox"
                  checked={localVisibleColumns.includes(column.key)}
                  onChange={() => handleToggleColumn(column.key)}
                />
                {column.label}
              </label>
            </div>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button 
            className={styles.btnCancel} 
            onClick={() => {
              setLocalVisibleColumns(visibleColumns);
              onClose();
            }}
          >
            Cancel
          </button>
          <button 
            className={styles.btnSecondary} 
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className={styles.btnPrimary} 
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageColumnsModal;