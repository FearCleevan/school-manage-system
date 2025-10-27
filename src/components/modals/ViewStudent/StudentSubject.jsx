//src/components/modals/ViewStudent/StudentSubject.jsx
import React from 'react';
import styles from './viewStudent.module.css';

const StudentSubject = ({ subjects, subjectLoading, subjectError }) => {
  if (subjectLoading) {
    return <div className={styles.loading}>Loading subjects...</div>;
  }

  if (subjectError) {
    return <div className={styles.subjectError}>{subjectError}</div>;
  }

  if (subjects.length === 0) {
    return <div className={styles.noSubjects}>No current subjects found</div>;
  }

  return (
    <div className={styles.subjectsContainer}>
      {subjects.map((subject, index) => (
        <div key={index} className={styles.subjectGroup}>
          <h4 className={styles.subjectTitle}>
            {subject.subjectName || 'Custom Subjects'}
          </h4>

          {/* First Term */}
          {subject.terms?.firstTerm?.length > 0 && (
            <div className={styles.termContainer}>
              <h5 className={styles.termTitle}>First Term</h5>
              <table className={styles.subjectTable}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Lec</th>
                    <th>Lab</th>
                    <th>Units</th>
                    <th>Pre Req</th>
                  </tr>
                </thead>
                <tbody>
                  {subject.terms.firstTerm.map((course, idx) => (
                    <tr key={`first-${idx}`}>
                      <td>{course.subjectCode}</td>
                      <td>{course.description}</td>
                      <td>{course.lec}</td>
                      <td>{course.lab}</td>
                      <td>{course.units}</td>
                      <td>{course.preReq || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Second Term */}
          {subject.terms?.secondTerm?.length > 0 && (
            <div className={styles.termContainer}>
              <h5 className={styles.termTitle}>Second Term</h5>
              <table className={styles.subjectTable}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Lec</th>
                    <th>Lab</th>
                    <th>Units</th>
                    <th>Pre Req</th>
                  </tr>
                </thead>
                <tbody>
                  {subject.terms.secondTerm.map((course, idx) => (
                    <tr key={`second-${idx}`}>
                      <td>{course.subjectCode}</td>
                      <td>{course.description}</td>
                      <td>{course.lec}</td>
                      <td>{course.lab}</td>
                      <td>{course.units}</td>
                      <td>{course.preReq || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StudentSubject;