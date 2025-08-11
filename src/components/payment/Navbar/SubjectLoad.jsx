import React from 'react';
import styles from './SubjectLoad.module.css';

const SubjectLoad = ({ student, subjects }) => {
    const calculateTotalUnits = () => {
        let totalUnits = 0;
        
        subjects.forEach(subject => {
            // For standard subjects
            if (subject.units) {
                totalUnits += parseFloat(subject.units) || 0;
            }
            // For customized subjects with terms
            else if (subject.terms) {
                Object.values(subject.terms).forEach(term => {
                    term.forEach(course => {
                        totalUnits += parseFloat(course.units) || 0;
                    });
                });
            }
        });
        
        return totalUnits;
    };

    const totalUnits = calculateTotalUnits();

    return (
        <div className={styles.subjectsSection}>
            <h3 className={styles.sectionTitle}>
                {student.enrollment?.course === 'Not enrolled'
                    ? 'Subject Load'
                    : `${student.enrollment?.course} (${student.enrollment?.semester})`}
            </h3>

            {subjects.length > 0 ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.subjectsTable}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Description</th>
                                <th>Units</th>
                                <th>Lecture</th>
                                <th>Laboratory</th>
                                <th>Pre Req</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subject, index) => {
                                // For standard subjects
                                if (subject.units) {
                                    return (
                                        <tr key={`std-${index}`}>
                                            <td>{subject.subjectCode || '-'}</td>
                                            <td>{subject.subjectName || subject.description || '-'}</td>
                                            <td>{subject.units || '0'}</td>
                                            <td>{subject.lec || '0'}</td>
                                            <td>{subject.lab || '0'}</td>
                                            <td>{subject.preReq || '-'}</td>
                                        </tr>
                                    );
                                }
                                // For customized subjects with terms
                                else if (subject.terms) {
                                    return Object.entries(subject.terms).map(([termName, termCourses]) => (
                                        <React.Fragment key={`${index}-${termName}`}>
                                            <tr className={styles.termHeader}>
                                                <td colSpan="6" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                    {termName.toUpperCase()}
                                                </td>
                                            </tr>
                                            {termCourses.map((course, idx) => (
                                                <tr key={`${index}-${termName}-${idx}`}>
                                                    <td>{course.subjectCode || '-'}</td>
                                                    <td>{course.description || '-'}</td>
                                                    <td>{course.units || '0'}</td>
                                                    <td>{course.lec || '0'}</td>
                                                    <td>{course.lab || '0'}</td>
                                                    <td>{course.preReq || '-'}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ));
                                }
                                return null;
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2">Total Units</td>
                                <td>{totalUnits}</td>
                                <td colSpan="3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className={styles.noSubjects}>
                    {student.enrollment?.course === 'Not enrolled'
                        ? 'Student is not currently enrolled'
                        : 'No subjects loaded for this semester'}
                </div>
            )}
        </div>
    );
};

export default SubjectLoad;