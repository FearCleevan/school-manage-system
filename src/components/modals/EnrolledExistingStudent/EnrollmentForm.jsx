import React from 'react';
import styles from './ExistingStudentEnroll.module.css';

const EnrollmentForm = ({
  studentData,
  enrollmentData,
  handleEnrollmentChange,
  handleSchoolYearChange,
  handleSubmit,
  loading,
  getAvailableCourses,
  getAvailableYearLevels,
  semesters
}) => (
  <div className={styles.enrollmentForm}>
    <div className={styles.profileSection}>
      {studentData.profilePhoto ? (
        <img
          src={studentData.profilePhoto}
          alt="Profile"
          className={styles.profileImage}
        />
      ) : (
        <div className={styles.profilePlaceholder}>
          <span>{studentData.firstName.charAt(0)}{studentData.lastName.charAt(0)}</span>
        </div>
      )}
      <h4 className={styles.studentName}>
        {studentData.firstName} {studentData.lastName}
      </h4>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.formLabel}>Course *</label>
      <select
        name="course"
        value={enrollmentData.course}
        onChange={handleEnrollmentChange}
        className={`${styles.formInput} ${styles.formSelect}`}
        disabled={loading}
      >
        {getAvailableCourses().map(course => (
          <option key={course} value={course}>{course}</option>
        ))}
      </select>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.formLabel}>Year Level *</label>
      <select
        name="yearLevel"
        value={enrollmentData.yearLevel}
        onChange={handleEnrollmentChange}
        className={`${styles.formInput} ${styles.formSelect}`}
        disabled={loading}
      >
        {getAvailableYearLevels().map(level => (
          <option key={level} value={level}>{level}</option>
        ))}
      </select>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.formLabel}>Semester *</label>
      <select
        name="semester"
        value={enrollmentData.semester}
        onChange={handleEnrollmentChange}
        className={`${styles.formInput} ${styles.formSelect}`}
        disabled={loading}
      >
        {semesters.map(sem => (
          <option key={sem} value={sem}>{sem}</option>
        ))}
      </select>
    </div>

    <div className={styles.formGroup}>
      <label className={styles.formLabel}>School Year *</label>
      <div className={styles.schoolYearInputs}>
        <input
          type="number"
          name="schoolYearFrom"
          value={enrollmentData.schoolYearFrom}
          onChange={handleSchoolYearChange}
          className={styles.formInput}
          disabled={loading}
        />
        <span className={styles.schoolYearSeparator}>-</span>
        <input
          type="number"
          name="schoolYearTo"
          value={enrollmentData.schoolYearTo}
          onChange={handleSchoolYearChange}
          className={styles.formInput}
          disabled={loading}
        />
      </div>
    </div>

    <button
      type="button"
      className={styles.submitBtn}
      onClick={handleSubmit}
      disabled={loading || !enrollmentData.course || !enrollmentData.yearLevel || !enrollmentData.semester}
    >
      {loading ? 'Updating...' : 'Submit Enrollment'}
    </button>
  </div>
);

export default EnrollmentForm;