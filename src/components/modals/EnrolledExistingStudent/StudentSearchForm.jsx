import React from 'react';
import styles from './ExistingStudentEnroll.module.css';

const StudentSearchForm = ({ 
  studentId, 
  setStudentId, 
  fetchStudentData, 
  loading, 
  searchPerformed 
}) => (
  <div className={styles.searchContainer}>
    <div className={styles.studentIdInput}>
      <label htmlFor="existingStudentId" className={styles.formLabel}>
        Enter Student ID
      </label>
      <input
        id="existingStudentId"
        type="text"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className={styles.formInput}
        placeholder="e.g., SPC25-0001"
      />
      <button
        className={styles.searchBtn}
        onClick={fetchStudentData}
        disabled={!studentId.trim() || loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
    {searchPerformed && !loading && (
      <p className={styles.notFoundMessage}>Student not found. Please check the ID and try again.</p>
    )}
  </div>
);

export default StudentSearchForm;