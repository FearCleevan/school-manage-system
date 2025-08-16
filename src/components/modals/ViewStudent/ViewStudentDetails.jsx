// src/components/modals/ViewStudentDetails.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import styles from './viewStudent.module.css';
import { FaTimes, FaPrint, FaFilePdf, FaFileExcel, FaRedo } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import StudentSubject from './StudentSubject';
import SubjectHistory from './SubjectHistory';


const ViewStudentDetails = ({ studentId, onClose }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [subjectHistory, setSubjectHistory] = useState([]);
    const [subjectError, setSubjectError] = useState(null);
    const [subjectLoading, setSubjectLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [activeTab, setActiveTab] = useState('current');

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                setError(null);
                const docRef = doc(db, 'students', studentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const studentData = docSnap.data();
                    const studentWithId = {
                        id: docSnap.id,
                        ...studentData,
                        customizedSubjects: studentData.customizedSubjects || null,
                        subjectHistory: studentData.subjectHistory || []
                    };
                    setStudent(studentWithId);
                    setSubjectHistory(studentWithId.subjectHistory);

                    if (studentData.enrollment) {
                        await loadSubjects(studentData.enrollment, studentWithId);
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

    const loadSubjects = async (enrollment, studentData) => {
        try {
            setSubjectLoading(true);
            setSubjectError(null);

            const { course, yearLevel, semester } = enrollment;

            // First check if student has customized subjects
            if (studentData?.customizedSubjects) {
                setSubjects(studentData.customizedSubjects);
                return;
            }

            // If no customized subjects, load the standard subjects
            const subjectsRef = collection(db, 'subjects');
            const q = query(
                subjectsRef,
                where('course', '==', course),
                where('yearLevel', '==', yearLevel),
                where('semester', '==', semester)
            );

            const querySnapshot = await getDocs(q);

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

    const handlePrint = () => {
        if (!student) return;

        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const studentName = formatFullName(student);
        const schoolYear = student.enrollment?.schoolYear || '2025-2026';

        printWindow.document.write(`
        <html>
            <head>
            <title>${studentName} Enrollment Form</title>
            <style>
                @page {
                size: legal;
                margin: 0.5cm;
                }
                body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 0;
                font-size: 10px;
                line-height: 1.2;
                }
                .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #333;
                }
                .school-info {
                text-align: right;
                }
                .school-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 3px;
                }
                .school-address {
                font-size: 10px;
                }
                .logo {
                height: 60px;
                width: auto;
                }
                .registration-title {
                text-align: center;
                font-size: 12px;
                font-weight: bold;
                margin: 10px 0;
                text-decoration: underline;
                }
                .student-info {
                width: 100%;
                margin-bottom: 10px;
                border-collapse: collapse;
                }
                .student-info td {
                padding: 3px;
                vertical-align: top;
                font-size: 14px;
                }
                .info-label {
                font-weight: bold;
                min-width: 100px;
                white-space: nowrap;
                font-size: 13px;
                }
                .subjects-title {
                text-align: center;
                font-weight: bold;
                margin: 10px 0 5px 0;
                padding-bottom: 3px;
                border-bottom: 1px solid #000;
                font-size: 11px;
                }
                .subject-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
                font-size: 9px;
                }
                .subject-table th, .subject-table td {
                border: 1px solid #ddd;
                padding: 4px;
                text-align: left;
                }
                .subject-table th {
                background-color: #f2f2f2;
                text-align: center;
                font-size: 9px;
                }
                .term-title {
                background-color: #f5f5f5;
                padding: 3px 5px;
                margin: 10px 0 5px 0;
                text-align: center;
                font-size: 10px;
                font-weight: bold;
                }
                .total-units-row {
                background-color: #f5f5f5;
                font-weight: bold;
                }
                .combined-total {
                text-align: right;
                margin: 10px 0 20px 0;
                font-weight: bold;
                font-size: 11px;
                }
                .combined-total span {
                padding: 3px 10px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                }
                .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
                font-size: 9px;
                }
                .footer-section {
                width: 23%;
                }
                .footer-label {
                font-weight: bold;
                margin-bottom: 20px;
                font-size: 9px;
                }
                .footer-line {
                padding-top: 3px;
                }
                .copy-title {
                text-align: center;
                font-weight: bold;
                margin: 10px 0;
                font-size: 11px;
                text-decoration: underline;
                }
                .compact-row {
                margin-bottom: 5px;
                }
            </style>
            </head>
            <body>
            <!-- Student's Copy -->
            <div class="copy-title">STUDENT'S COPY</div>
            
            <div class="header">
                <img src="/school-logo.png" class="logo" alt="School Logo">
                <div class="school-info">
                <div class="school-name">SAMSON POLYTECHNIC COLLEGE OF DAVAO</div>
                <div class="school-address">R.Magsaysay Ave.(Uyanguren) corner Narra St. ( fronting DPWH), Davao City</div>
                <div class="school-address">(082)227-2392</div>
                <div class="school-address">samson_technical@yahoo.com</div>
                </div>
            </div>
            
            <div class="registration-title">REGISTRATION DETAILS</div>
            
            <table class="student-info">
                <tr>
                <td class="info-label">Date of Admission/Enrollment:</td>
                <td>${currentDate}</td>
                <td class="info-label">School Year:</td>
                <td>${schoolYear}</td>
                <td class="info-label">Status:</td>
                <td>${student.status || 'Enrolled'}</td>
                </tr>
                <tr>
                <td class="info-label">Full Name:</td>
                <td>${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}</td>
                </tr>
                <tr>
                <td class="info-label">Course:</td>
                <td>${student.enrollment?.course || 'Not enrolled'}</td>
                <td class="info-label">Year Level:</td>
                <td>${student.enrollment?.yearLevel || 'Not enrolled'}</td>
                <td class="info-label">Semester:</td>
                <td>${student.enrollment?.semester || 'Not enrolled'}</td>
                </tr>
            </table>
            
            <div class="subjects-title">ENROLLED SUBJECTS</div>
            
            ${subjects.map(subject => {
            const firstTermTotal = subject.terms?.firstTerm?.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0) || 0;
            const secondTermTotal = subject.terms?.secondTerm?.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0) || 0;
            const combinedTotal = firstTermTotal + secondTermTotal;

            return `
                <div class="compact-row">
                ${subject.terms?.firstTerm?.length > 0 ? `
                    <div class="term-title">FIRST TERM</div>
                    <table class="subject-table">
                    <thead>
                        <tr>
                        <th style="width: 12%">Code</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 5%">Lec</th>
                        <th style="width: 5%">Lab</th>
                        <th style="width: 5%">Units</th>
                        <th style="width: 10%">Days</th>
                        <th style="width: 15%">Time</th>
                        <th style="width: 13%">Room No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subject.terms.firstTerm.map(course => `
                        <tr>
                            <td>${course.subjectCode}</td>
                            <td>${course.description}</td>
                            <td>${course.lec}</td>
                            <td>${course.lab}</td>
                            <td>${course.units}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        `).join('')}
                        <tr class="total-units-row">
                            <td colspan="4" style="text-align: right;">Total Units:</td>
                            <td>${firstTermTotal}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                    </table>
                ` : ''}
                
                ${subject.terms?.secondTerm?.length > 0 ? `
                    <div class="term-title">SECOND TERM</div>
                    <table class="subject-table">
                    <thead>
                        <tr>
                        <th style="width: 12%">Code</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 5%">Lec</th>
                        <th style="width: 5%">Lab</th>
                        <th style="width: 5%">Units</th>
                        <th style="width: 10%">Days</th>
                        <th style="width: 15%">Time</th>
                        <th style="width: 13%">Room No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subject.terms.secondTerm.map(course => `
                        <tr>
                            <td>${course.subjectCode}</td>
                            <td>${course.description}</td>
                            <td>${course.lec}</td>
                            <td>${course.lab}</td>
                            <td>${course.units}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        `).join('')}
                        <tr class="total-units-row">
                            <td colspan="4" style="text-align: right;">Total Units:</td>
                            <td>${secondTermTotal}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                    </table>
                ` : ''}
                
                <div class="combined-total">
                    <span>Total Units: ${combinedTotal}</span>
                </div>
                
                ${student.enrollment?.semester === 'Summer' && subject.terms?.firstTerm?.length > 0 ? `
                    <div class="term-title">SUMMER</div>
                    <table class="subject-table">
                    <thead>
                        <tr>
                        <th style="width: 12%">Code</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 5%">Lec</th>
                        <th style="width: 5%">Lab</th>
                        <th style="width: 5%">Units</th>
                        <th style="width: 10%">Days</th>
                        <th style="width: 15%">Time</th>
                        <th style="width: 13%">Room No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subject.terms.firstTerm.map(course => `
                        <tr>
                            <td>${course.subjectCode}</td>
                            <td>${course.description}</td>
                            <td>${course.lec}</td>
                            <td>${course.lab}</td>
                            <td>${course.units}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        `).join('')}
                        <tr class="total-units-row">
                            <td colspan="4" style="text-align: right;">Total Units:</td>
                            <td>${subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0)}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                    </table>
                ` : ''}
                </div>
                `;
        }).join('')}
            
            <div class="footer">
                <div class="footer-section">
                <div class="footer-label">Confirmed By:</div>
                <div>Student's Signature / Date:</div>
                <div class="footer-line">${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}</div>
                </div>
                <div class="footer-section">
                <div class="footer-label">Approved By:</div>
                <div>Program Head Dean of College / Date:</div>
                <div class="footer-line">Sample D. Name</div>
                </div>
                <div class="footer-section">
                <div class="footer-label">Assisted By:</div>
                <div>Cashier / Date</div>
                <div class="footer-line">Sample D. Name</div>
                </div>
                <div class="footer-section">
                <div class="footer-label">Copy Received By:</div>
                <div>Registrar / Date</div>
                <div class="footer-line">Sample D. Name</div>
                </div>
            </div>
            
            <!-- Registrar's Copy -->
            <div class="copy-title">REGISTRAR'S COPY</div>
            
            <div class="header">
                <img src="/school-logo.png" class="logo" alt="School Logo">
                <div class="school-info">
                <div class="school-name">SAMSON POLYTECHNIC COLLEGE OF DAVAO</div>
                <div class="school-address">R.Magsaysay Ave.(Uyanguren) corner Narra St. ( fronting DPWH), Davao City</div>
                <div class="school-address">(082)227-2392</div>
                <div class="school-address">samson_technical@yahoo.com</div>
                </div>
            </div>
            
            <div class="registration-title">REGISTRATION DETAILS</div>
            
            <table class="student-info">
                <tr>
                <td class="info-label">Date of Admission/Enrollment:</td>
                <td>${currentDate}</td>
                <td class="info-label">School Year:</td>
                <td>${schoolYear}</td>
                <td class="info-label">Status:</td>
                <td>${student.status || 'Enrolled'}</td>
                </tr>
                <tr>
                <td class="info-label">Full Name:</td>
                <td>${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}</td>
                </tr>
                <tr>
                <td class="info-label">Course:</td>
                <td>${student.enrollment?.course || 'Not enrolled'}</td>
                <td class="info-label">Year Level:</td>
                <td>${student.enrollment?.yearLevel || 'Not enrolled'}</td>
                <td class="info-label">Semester:</td>
                <td>${student.enrollment?.semester || 'Not enrolled'}</td>
                </tr>
            </table>
            
            <div class="subjects-title">ENROLLED SUBJECTS</div>
            
            ${subjects.map(subject => {
            const firstTermTotal = subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            const secondTermTotal = subject.terms.secondTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            const combinedTotal = firstTermTotal + secondTermTotal;

            return `
                <div class="compact-row">
                ${subject.terms?.firstTerm?.length > 0 ? `
                    <div class="term-title">FIRST TERM</div>
                    <table class="subject-table">
                    <thead>
                        <tr>
                        <th style="width: 12%">Code</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 5%">Lec</th>
                        <th style="width: 5%">Lab</th>
                        <th style="width: 5%">Units</th>
                        <th style="width: 10%">Days</th>
                        <th style="width: 15%">Time</th>
                        <th style="width: 13%">Room No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subject.terms.firstTerm.map(course => `
                        <tr>
                            <td>${course.subjectCode}</td>
                            <td>${course.description}</td>
                            <td>${course.lec}</td>
                            <td>${course.lab}</td>
                            <td>${course.units}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        `).join('')}
                        <tr class="total-units-row">
                            <td colspan="4" style="text-align: right;">Total Units:</td>
                            <td>${firstTermTotal}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                    </table>
                ` : ''}
                
                ${subject.terms?.secondTerm?.length > 0 ? `
                    <div class="term-title">SECOND TERM</div>
                    <table class="subject-table">
                    <thead>
                        <tr>
                        <th style="width: 12%">Code</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 5%">Lec</th>
                        <th style="width: 5%">Lab</th>
                        <th style="width: 5%">Units</th>
                        <th style="width: 10%">Days</th>
                        <th style="width: 15%">Time</th>
                        <th style="width: 13%">Room No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subject.terms.secondTerm.map(course => `
                        <tr>
                            <td>${course.subjectCode}</td>
                            <td>${course.description}</td>
                            <td>${course.lec}</td>
                            <td>${course.lab}</td>
                            <td>${course.units}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        `).join('')}
                        <tr class="total-units-row">
                            <td colspan="4" style="text-align: right;">Total Units:</td>
                            <td>${secondTermTotal}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                    </table>
                ` : ''}
                
                <div class="combined-total">
                    <span>Total Units: ${combinedTotal}</span>
                </div>
                
                ${student.enrollment?.semester === 'Summer' && subject.terms?.firstTerm?.length > 0 ? `
                    <div class="term-title">SUMMER</div>
                    <table class="subject-table">
                    <thead>
                        <tr>
                        <th style="width: 12%">Code</th>
                        <th style="width: 35%">Description</th>
                        <th style="width: 5%">Lec</th>
                        <th style="width: 5%">Lab</th>
                        <th style="width: 5%">Units</th>
                        <th style="width: 10%">Days</th>
                        <th style="width: 15%">Time</th>
                        <th style="width: 13%">Room No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subject.terms.firstTerm.map(course => `
                        <tr>
                            <td>${course.subjectCode}</td>
                            <td>${course.description}</td>
                            <td>${course.lec}</td>
                            <td>${course.lab}</td>
                            <td>${course.units}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        `).join('')}
                        <tr class="total-units-row">
                            <td colspan="4" style="text-align: right;">Total Units:</td>
                            <td>${subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0)}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tbody>
                    </table>
                ` : ''}
                </div>
                `;
        }).join('')}
            
            <div class="footer">
                <div class="footer-section">
                <div class="footer-label">Confirmed By:</div>
                <div>Student's Signature / Date:</div>
                <div class="footer-line">${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}</div>
                </div>
                <div class="footer-section">
                <div class="footer-label">Approved By:</div>
                <div>Program Head Dean of College / Date:</div>
                <div class="footer-line">Sample D. Name</div>
                </div>
                <div class="footer-section">
                <div class="footer-label">Assisted By:</div>
                <div>Cashier / Date</div>
                <div class="footer-line">Sample D. Name</div>
                </div>
                <div class="footer-section">
                <div class="footer-label">Copy Received By:</div>
                <div>Registrar / Date</div>
                <div class="footer-line">Sample D. Name</div>
                </div>
            </div>
            </body>
        </html>
    `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    if (!studentId) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2>Student Details</h2>
                    <div className={styles.headerButtons}>
                        <button className={styles.closeButton} onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
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
                                        {activeTab === 'current' && subjects.length > 0 && (
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

                                {/* Add the tabs with matching styling */}
                                <div className={styles.paymentTabs}>
                                    <button
                                        className={`${styles.tabButton} ${activeTab === 'current' ? styles.active : ''}`}
                                        onClick={() => setActiveTab('current')}
                                    >
                                        Current Subjects
                                    </button>
                                    <button
                                        className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                                        onClick={() => setActiveTab('history')}
                                    >
                                        Subject History
                                    </button>
                                </div>

                                <div className={styles.tabContent}>
                                    {activeTab === 'current' ? (
                                        <StudentSubject 
                                            subjects={subjects}
                                            subjectLoading={subjectLoading}
                                            subjectError={subjectError}
                                        />
                                    ) : (
                                        <SubjectHistory 
                                            subjectHistory={subjectHistory}
                                            loading={historyLoading}
                                            error={historyError}
                                        />
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewStudentDetails;