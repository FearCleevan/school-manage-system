import React from 'react';
import { FaPlus, FaEdit, FaSave } from 'react-icons/fa';
import styles from './ExistingStudentEnroll.module.css';
import SubjectTermTable from './SubjectTermTable';

const SubjectsDisplay = ({
  showSubjects,
  subjects,
  enrollmentData,
  editingMode,
  toggleEditingMode,
  handleClearCustomization,
  loading,
  handleAddRow,
  handleSubjectChange,
  handleDeleteRow,
  showDeleteModal,
  setShowDeleteModal,
  confirmDeleteRow,
  subjectToDelete
}) => {
  if (!showSubjects || subjects.length === 0) return null;

  return (
    <div className={styles.subjectsContainer}>
      <div className={styles.subjectsHeader}>
        <h4 className={styles.subjectsTitle}>
          Subjects for {enrollmentData.course} - {enrollmentData.yearLevel} - {enrollmentData.semester}
        </h4>
        <button
          type="button"
          className={styles.editBtn}
          onClick={toggleEditingMode}
          disabled={loading}
        >
          {editingMode ? (
            <>
              <FaSave /> Save View
            </>
          ) : (
            <>
              <FaEdit /> Customize Subjects
            </>
          )}
        </button>

        {editingMode && (
          <button
            type="button"
            className={styles.clearCustomBtn}
            onClick={handleClearCustomization}
            disabled={loading}
          >
            Clear Customization
          </button>
        )}
      </div>

      {subjects.map((subject, subjectIndex) => (
        <div key={subjectIndex} className={styles.subjectGroup}>
          {subject.terms.firstTerm.length > 0 && (
            <div className={styles.termContainer}>
              <h6 className={styles.termTitle}>First Term</h6>
              <SubjectTermTable
                term="firstTerm"
                termSubjects={subject.terms.firstTerm}
                subjectIndex={subjectIndex}
                editingMode={editingMode}
                handleSubjectChange={handleSubjectChange}
                handleDeleteRow={handleDeleteRow}
              />
              {editingMode && (
                <button
                  className={styles.addRowBtn}
                  onClick={() => handleAddRow(subjectIndex, 'firstTerm')}
                >
                  <FaPlus /> Add Row
                </button>
              )}
            </div>
          )}

          {subject.terms.secondTerm.length > 0 && (
            <div className={styles.termContainer}>
              <h6 className={styles.termTitle}>Second Term</h6>
              <SubjectTermTable
                term="secondTerm"
                termSubjects={subject.terms.secondTerm}
                subjectIndex={subjectIndex}
                editingMode={editingMode}
                handleSubjectChange={handleSubjectChange}
                handleDeleteRow={handleDeleteRow}
              />
              {editingMode && (
                <button
                  className={styles.addRowBtn}
                  onClick={() => handleAddRow(subjectIndex, 'secondTerm')}
                >
                  <FaPlus /> Add Row
                </button>
              )}
            </div>
          )}

          {enrollmentData.semester === 'Summer' && subject.terms.firstTerm.length > 0 && (
            <div className={styles.termContainer}>
              <h6 className={styles.termTitle}>Summer</h6>
              <SubjectTermTable
                term="firstTerm"
                termSubjects={subject.terms.firstTerm}
                subjectIndex={subjectIndex}
                editingMode={editingMode}
                handleSubjectChange={handleSubjectChange}
                handleDeleteRow={handleDeleteRow}
              />
              {editingMode && (
                <button
                  className={styles.addRowBtn}
                  onClick={() => handleAddRow(subjectIndex, 'firstTerm')}
                >
                  <FaPlus /> Add Row
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
      )}
    </div>
  );
};

export default SubjectsDisplay;