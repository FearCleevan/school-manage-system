import React from 'react';
import styles from './ViewSubject.module.css';

const ViewSubject = ({ show, onClose, subject }) => {
  if (!show || !subject) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Subject Details</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className={styles.subjectDetails}>
          <div className={styles.detailRow}>
            <div className={styles.detailGroup}>
              <label>Subject ID:</label>
              <p>{subject.subjectId}</p>
            </div>
            
            <div className={styles.detailGroup}>
              <label>Subject Name:</label>
              <p>{subject.subjectName}</p>
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailGroup}>
              <label>Course:</label>
              <p>{subject.course}</p>
            </div>
            
            <div className={styles.detailGroup}>
              <label>Year Level:</label>
              <p>{subject.yearLevel}</p>
            </div>
            
            <div className={styles.detailGroup}>
              <label>Semester:</label>
              <p>{subject.semester}</p>
            </div>
          </div>

          <div className={styles.detailGroup}>
            <label>Status:</label>
            <p className={`${styles.statusBadge} ${subject.status.toLowerCase()}`}>
              {subject.status}
            </p>
          </div>

          <div className={styles.termDetails}>
            <h4>Subject Loading Details</h4>

            <div className={styles.termSection}>
              <h5>1st Term:</h5>
              {subject.terms?.firstTerm?.length > 0 ? (
                <table className={styles.termTable}>
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Description</th>
                      <th>Lec</th>
                      <th>Lab</th>
                      <th>Units</th>
                      <th>Pre Req</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.terms.firstTerm.map((row, index) => (
                      <tr key={`firstTerm-${index}`}>
                        <td>{row.subjectCode}</td>
                        <td>{row.description}</td>
                        <td>{row.lec}</td>
                        <td>{row.lab}</td>
                        <td>{row.units}</td>
                        <td>{row.preReq}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={styles.noData}>No first term subjects</p>
              )}
            </div>

            {subject.semester !== 'Summer' && (
              <div className={styles.termSection}>
                <h5>2nd Term:</h5>
                {subject.terms?.secondTerm?.length > 0 ? (
                  <table className={styles.termTable}>
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Description</th>
                        <th>Lec</th>
                        <th>Lab</th>
                        <th>Units</th>
                        <th>Pre Req</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subject.terms.secondTerm.map((row, index) => (
                        <tr key={`secondTerm-${index}`}>
                          <td>{row.subjectCode}</td>
                          <td>{row.description}</td>
                          <td>{row.lec}</td>
                          <td>{row.lab}</td>
                          <td>{row.units}</td>
                          <td>{row.preReq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.noData}>No second term subjects</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewSubject;