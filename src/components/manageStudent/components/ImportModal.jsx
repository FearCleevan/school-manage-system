//src/components/manageStudent/components/ImportModal.jsx
import React from 'react';
import '../studentManagement.css';

const ImportModal = ({ 
  isOpen, 
  fileName, 
  progress, 
  status, 
  onCancel, 
  onImport 
}) => {
  if (!isOpen) return null;

  return (
    <div className="import-modal-overlay">
      <div className="import-modal">
        <h3>Import Students</h3>
        <p>File: {fileName}</p>

        <div className="import-info">
          <p>
            <strong>Note:</strong> Students will be imported to their
            specified departments.
          </p>
          <p>Valid department values: College, TVET, SHS, JHS</p>
        </div>

        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="import-status">{status}</p>

        <div className="import-actions">
          <button
            onClick={onCancel}
            disabled={progress > 0 && progress < 100}
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={progress > 0 && progress < 100}
          >
            {progress === 0 ? "Start Import" : "Importing..."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;