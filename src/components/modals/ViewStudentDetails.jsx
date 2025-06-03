import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import styles from './viewStudent.module.css';
import { FaTimes, FaPrint, FaFilePdf, FaFileExcel, FaRedo } from 'react-icons/fa';
import { CSVLink } from 'react-csv';

const ViewStudentDetails = ({ studentId, onClose }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [subjectError, setSubjectError] = useState(null);
    const [subjectLoading, setSubjectLoading] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);
                const docRef = doc(db, 'students', studentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const studentData = docSnap.data();
                    setStudent({
                        id: docSnap.id,
                        ...studentData
                    });

                    if (studentData.enrollment) {
                        await loadSubjects(studentData.enrollment);
                    }
                } else {
                    setError('Student not found');
                }
            } catch (err) {
                console.error('Error fetching student:', err);
                setError(`Failed to load student data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchStudentData();
        }
    }, [studentId]);

    const loadSubjects = async (enrollment) => {
        try {
            setSubjectLoading(true);
            setSubjectError(null);
            
            const { course, yearLevel, semester } = enrollment;
            console.log('Loading subjects for:', { course, yearLevel, semester });

            const subjectsRef = collection(db, 'subjects');
            const q = query(
                subjectsRef,
                where('course', '==', course),
                where('yearLevel', '==', yearLevel),
                where('semester', '==', semester)
            );

            const querySnapshot = await getDocs(q);
            console.log('Found subjects:', querySnapshot.docs.length);

            if (querySnapshot.empty) {
                setSubjectError('No subjects found for this enrollment');
                setSubjects([]);
                return;
            }

            const loadedSubjects = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                terms: doc.data().terms || { firstTerm: [], secondTerm: [] }
            }));

            setSubjects(loadedSubjects);
        } catch (err) {
            console.error('Error loading subjects:', err);
            setSubjectError(`Failed to load subjects: ${err.message}`);
            setSubjects([]);
        } finally {
            setSubjectLoading(false);
        }
    };

    const getDepartmentLabel = (dept) => {
        const labels = {
            college: 'College',
            tvet: 'TVET',
            shs: 'Senior High',
            jhs: 'Junior High'
        };
        return labels[dept] || dept;
    };

    const formatFullName = (student) => {
        return `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}`;
    };

    const formatAddress = (student) => {
        if (!student.address) return '';
        return `${student.address.street || ''}, ${student.address.city || ''}, ${student.address.province || ''}`;
    };

    if (!studentId) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2>Student Details</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    {loading ? (
                        <div className={styles.loading}>Loading student data...</div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <>
                            <div className={styles.studentDetails}>
                                <div className={styles.profileSection}>
                                    {student.profilePhoto ? (
                                        <img
                                            src={student.profilePhoto}
                                            alt="Profile"
                                            className={styles.profileImage}
                                        />
                                    ) : (
                                        <div className={styles.profilePlaceholder}>
                                            {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                        </div>
                                    )}
                                    <h3 className={styles.studentName}>{formatFullName(student)}</h3>
                                </div>

                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Student ID:</span>
                                        <span className={styles.detailValue}>{student.studentId}</span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Department:</span>
                                        <span className={styles.detailValue}>
                                            {getDepartmentLabel(student.department)}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Course:</span>
                                        <span className={styles.detailValue}>
                                            {student.enrollment?.course || 'Not enrolled'}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Year Level:</span>
                                        <span className={styles.detailValue}>
                                            {student.enrollment?.yearLevel || 'Not enrolled'}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Semester:</span>
                                        <span className={styles.detailValue}>
                                            {student.enrollment?.semester || 'Not enrolled'}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>School Year:</span>
                                        <span className={styles.detailValue}>
                                            {student.enrollment?.schoolYear || 'Not enrolled'}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Status:</span>
                                        <span className={`${styles.detailValue} ${styles.statusBadge} ${student.status?.toLowerCase()}`}>
                                            {student.status || 'Unknown'}
                                        </span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Email:</span>
                                        <span className={styles.detailValue}>{student.email}</span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Phone:</span>
                                        <span className={styles.detailValue}>{student.phone}</span>
                                    </div>

                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Address:</span>
                                        <span className={styles.detailValue}>{formatAddress(student)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.subjectsSection}>
                                <div className={styles.sectionHeader}>
                                    <h3>Enrolled Subjects</h3>
                                    <div className={styles.exportButtons}>
                                        {student.enrollment && (
                                            <button 
                                                className={styles.refreshButton}
                                                onClick={() => loadSubjects(student.enrollment)}
                                                disabled={subjectLoading}
                                            >
                                                <FaRedo /> Refresh
                                            </button>
                                        )}
                                        {subjects.length > 0 && (
                                            <>
                                                <CSVLink
                                                    data={subjects}
                                                    filename={`${student.studentId}-subjects.csv`}
                                                    className={styles.exportButton}
                                                >
                                                    <FaFileExcel /> Excel
                                                </CSVLink>
                                                <button className={styles.exportButton}>
                                                    <FaFilePdf /> PDF
                                                </button>
                                                <button className={styles.exportButton}>
                                                    <FaPrint /> Print
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {subjectError && (
                                    <div className={styles.subjectError}>
                                        {subjectError}
                                    </div>
                                )}

                                {subjectLoading ? (
                                    <div className={styles.loading}>Loading subjects...</div>
                                ) : subjects.length > 0 ? (
                                    <div className={styles.subjectsContainer}>
                                        {subjects.map((subject, index) => (
                                            <div key={index} className={styles.subjectGroup}>
                                                <h4 className={styles.subjectTitle}>
                                                    {subject.subjectName}
                                                </h4>

                                                {subject.terms.firstTerm.length > 0 && (
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

                                                {subject.terms.secondTerm.length > 0 && (
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
                                ) : (
                                    <div className={styles.noSubjects}>
                                        {student.enrollment 
                                            ? 'No subjects found for this enrollment'
                                            : 'Student is not currently enrolled'}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewStudentDetails;