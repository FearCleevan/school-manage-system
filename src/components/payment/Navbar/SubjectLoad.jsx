import React from 'react';
import styles from './SubjectLoad.module.css';

const SubjectLoad = ({ student, subjects }) => {
    const calculateTotalUnits = () => {
        let totalUnits = 0;
        
        subjects.forEach(subject => {
            // For standard subjects (direct subject objects)
            if (subject.units) {
                totalUnits += parseFloat(subject.units) || 0;
            }
            // For subjects with terms structure
            else if (subject.terms) {
                // First term
                if (subject.terms.firstTerm) {
                    subject.terms.firstTerm.forEach(course => {
                        totalUnits += parseFloat(course.units) || 0;
                    });
                }
                // Second term
                if (subject.terms.secondTerm) {
                    subject.terms.secondTerm.forEach(course => {
                        totalUnits += parseFloat(course.units) || 0;
                    });
                }
            }
            // For direct array of courses (legacy format)
            else if (Array.isArray(subject)) {
                subject.forEach(course => {
                    totalUnits += parseFloat(course.units) || 0;
                });
            }
        });
        
        return totalUnits;
    };

    const totalUnits = calculateTotalUnits();

    const renderCourseRow = (course, index) => {
        return (
            <tr key={`course-${index}`}>
                <td>{course.subjectCode || course.code || '-'}</td>
                <td>{course.description || course.subjectName || '-'}</td>
                <td>{course.lec || '0'}</td>
                <td>{course.lab || '0'}</td>
                <td>{course.units || '0'}</td>
                <td>{course.preReq || course.prerequisite || '-'}</td>
            </tr>
        );
    };

    const renderSubjectGroup = (subject, index) => {
        // For standard subjects (direct subject objects)
        if (subject.units) {
            return renderCourseRow(subject, index);
        }
        
        // For subjects with terms structure
        if (subject.terms) {
            return (
                <React.Fragment key={`subject-${index}`}>
                    {/* First Term */}
                    {subject.terms.firstTerm?.length > 0 && (
                        <>
                            <tr className={styles.termHeader}>
                                <td colSpan="6" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    FIRST TERM
                                </td>
                            </tr>
                            {subject.terms.firstTerm.map((course, idx) => (
                                renderCourseRow(course, idx)
                            ))}
                        </>
                    )}
                    
                    {/* Second Term */}
                    {subject.terms.secondTerm?.length > 0 && (
                        <>
                            <tr className={styles.termHeader}>
                                <td colSpan="6" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    SECOND TERM
                                </td>
                            </tr>
                            {subject.terms.secondTerm.map((course, idx) => (
                                renderCourseRow(course, idx)
                            ))}
                        </>
                    )}
                </React.Fragment>
            );
        }
        
        // For direct array of courses (legacy format)
        if (Array.isArray(subject)) {
            return subject.map((course, idx) => (
                renderCourseRow(course, idx)
            ));
        }

        return null;
    };

    return (
        <div className={styles.subjectsSection}>
            <h3 className={styles.sectionTitle}>
                {student.enrollment?.course === 'Not enrolled'
                    ? 'Subject Load'
                    : `${student.enrollment?.course} ${student.enrollment?.yearLevel} (${student.enrollment?.semester})`}
            </h3>

            {subjects && subjects.length > 0 ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.subjectsTable}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Description</th>
                                <th>Lecture</th>
                                <th>Laboratory</th>
                                <th>Units</th>
                                <th>Pre Req</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subject, index) => (
                                renderSubjectGroup(subject, index)
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="4">Total Units</td>
                                <td>{totalUnits}</td>
                                <td></td>
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