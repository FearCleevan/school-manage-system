import React from 'react';
import styles from './ExistingStudentEnroll.module.css';

const StudentDetailsSection = ({ studentData, loadSubjects, loading }) => (
  <div className={styles.studentDetails}>
    <h3 className={styles.sectionTitle}>Student Details</h3>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>ID:</span>
      <span className={styles.detailValue}>{studentData.studentId}</span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Department:</span>
      <span className={styles.detailValue}>
        {studentData.department === 'college' ? 'College' :
          studentData.department === 'tvet' ? 'TVET' :
            studentData.department === 'shs' ? 'Senior High School' :
              studentData.department === 'jhs' ? 'Junior High School' : ''}
      </span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Course:</span>
      <span className={styles.detailValue}>
        {studentData.enrollment?.course || 'Not enrolled'}
      </span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Year Level:</span>
      <span className={styles.detailValue}>
        {studentData.enrollment?.yearLevel || 'Not enrolled'}
      </span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Semester:</span>
      <span className={styles.detailValue}>
        {studentData.enrollment?.semester || 'Not enrolled'}
      </span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>School Year:</span>
      <span className={styles.detailValue}>
        {studentData.enrollment?.schoolYear || 'Not enrolled'}
      </span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Full Name:</span>
      <span className={styles.detailValue}>
        {`${studentData.firstName} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName}`}
      </span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Email:</span>
      <span className={styles.detailValue}>{studentData.email}</span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Phone:</span>
      <span className={styles.detailValue}>{studentData.phone}</span>
    </div>

    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Address:</span>
      <span className={styles.detailValue}>
        {`${studentData.address?.street}, ${studentData.address?.city}, ${studentData.address?.province}`}
      </span>
    </div>

    {studentData.enrollment && (
      <button
        type="button"
        className={styles.loadSubjectsBtn}
        onClick={loadSubjects}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load Subjects'}
      </button>
    )}
  </div>
);

export default StudentDetailsSection;