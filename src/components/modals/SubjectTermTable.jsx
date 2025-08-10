import React from 'react';
import { FaTrash } from 'react-icons/fa';
import styles from './ExistingStudentEnroll.module.css';

const SubjectTermTable = ({
  term,
  termSubjects,
  subjectIndex,
  editingMode,
  handleSubjectChange,
  handleDeleteRow
}) => (
  <div className={styles.tableWrapper}>
    <table className={styles.subjectsTable}>
      <thead>
        <tr>
          <th>Code</th>
          <th>Description</th>
          <th>Lec</th>
          <th>Lab</th>
          <th>Units</th>
          <th>Pre Req</th>
          {editingMode && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {termSubjects.map((course, rowIndex) => (
          <tr key={`${term}-${rowIndex}`}>
            <td>
              {editingMode ? (
                <input
                  type="text"
                  value={course.subjectCode}
                  onChange={(e) => handleSubjectChange(
                    subjectIndex,
                    term,
                    rowIndex,
                    'subjectCode',
                    e.target.value
                  )}
                  className={styles.tableInput}
                />
              ) : (
                course.subjectCode
              )}
            </td>
            <td>
              {editingMode ? (
                <input
                  type="text"
                  value={course.description}
                  onChange={(e) => handleSubjectChange(
                    subjectIndex,
                    term,
                    rowIndex,
                    'description',
                    e.target.value
                  )}
                  className={styles.tableInput}
                />
              ) : (
                course.description
              )}
            </td>
            <td>
              {editingMode ? (
                <input
                  type="text"
                  value={course.lec}
                  onChange={(e) => handleSubjectChange(
                    subjectIndex,
                    term,
                    rowIndex,
                    'lec',
                    e.target.value
                  )}
                  className={styles.tableInput}
                />
              ) : (
                course.lec
              )}
            </td>
            <td>
              {editingMode ? (
                <input
                  type="text"
                  value={course.lab}
                  onChange={(e) => handleSubjectChange(
                    subjectIndex,
                    term,
                    rowIndex,
                    'lab',
                    e.target.value
                  )}
                  className={styles.tableInput}
                />
              ) : (
                course.lab
              )}
            </td>
            <td>
              {editingMode ? (
                <input
                  type="text"
                  value={course.units}
                  onChange={(e) => handleSubjectChange(
                    subjectIndex,
                    term,
                    rowIndex,
                    'units',
                    e.target.value
                  )}
                  className={styles.tableInput}
                />
              ) : (
                course.units
              )}
            </td>
            <td>
              {editingMode ? (
                <input
                  type="text"
                  value={course.preReq}
                  onChange={(e) => handleSubjectChange(
                    subjectIndex,
                    term,
                    rowIndex,
                    'preReq',
                    e.target.value
                  )}
                  className={styles.tableInput}
                />
              ) : (
                course.preReq || '-'
              )}
            </td>
            {editingMode && (
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteRow(
                    subjectIndex,
                    term,
                    rowIndex
                  )}
                  title="Delete row"
                >
                  <FaTrash />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SubjectTermTable;