//src/components/modals/ViewStudent/SubjectHistory.jsx
import React from 'react';
import styles from './viewStudent.module.css';

const SubjectHistory = ({ subjectHistory, loading, error }) => {
  if (loading) {
    return <div className={styles.loading}>Loading subject history...</div>;
  }

  if (error) {
    return <div className={styles.subjectError}>{error}</div>;
  }

  if (!subjectHistory || subjectHistory.length === 0) {
    return <div className={styles.noSubjects}>No subject history available</div>;
  }

  return (
    <div className={styles.historyContainer}>
      {subjectHistory.map((historyItem, index) => (
        <div key={index} className={styles.historyItem}>
          <div className={styles.historyHeader}>
            <h4>{historyItem.schoolYear || 'Unknown School Year'}</h4>
            <span className={styles.historySemester}>
              {historyItem.semester || 'Unknown Semester'}
            </span>
          </div>
          
          <div className={styles.historySubjects}>
            {historyItem.subjects.map((subject, subIndex) => (
              <div key={subIndex} className={styles.historySubject}>
                <div className={styles.historySubjectTitle}>
                  {subject.subjectName || 'Custom Subjects'}
                </div>
                
                {subject.terms?.firstTerm?.length > 0 && (
                  <div className={styles.historyTerm}>
                    <h5>First Term</h5>
                    <ul>
                      {subject.terms.firstTerm.map((course, idx) => (
                        <li key={`first-${idx}`}>
                          {course.subjectCode} - {course.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {subject.terms?.secondTerm?.length > 0 && (
                  <div className={styles.historyTerm}>
                    <h5>Second Term</h5>
                    <ul>
                      {subject.terms.secondTerm.map((course, idx) => (
                        <li key={`second-${idx}`}>
                          {course.subjectCode} - {course.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubjectHistory;