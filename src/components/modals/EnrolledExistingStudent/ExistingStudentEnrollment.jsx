// src/components/modals/ExistingStudentEnrollment.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { logActivity } from '../../../lib/firebase/activityLogger';
import { auth } from '../../../lib/firebase/config';
import styles from './ExistingStudentEnroll.module.css';
import { FaPrint } from 'react-icons/fa';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import StudentSearchForm from './StudentSearchForm';
import StudentDetailsSection from './StudentDetailsSection';
import EnrollmentForm from './EnrollmentForm';
import SubjectsDisplay from './SubjectsDisplay';

const ExistingStudentEnrollment = ({ show, onClose }) => {
    // State declarations
    const [studentId, setStudentId] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [showSubjects, setShowSubjects] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [editingMode, setEditingMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [subjectHistory, setSubjectHistory] = useState([]);

    const [enrollmentData, setEnrollmentData] = useState({
        course: '',
        yearLevel: '',
        semester: '',
        schoolYearFrom: new Date().getFullYear(),
        schoolYearTo: new Date().getFullYear() + 1,
        isIrregular: false
    });

    // Available options
    const collegeCourses = ['Select Course', 'BSIT', 'BSHM', 'BSBA', 'BSTM'];
    const tvetCourses = ['Select Course', 'BTVTeD-AT', 'BTVTeD-HVACR TECH', 'BTVTeD-FSM', 'BTVTeD-ET'];
    const shsCourses = ['Select Course', 'Select', 'SHS'];
    const jhsCourses = ['Select Course', 'Select', 'JHS'];

    const yearLevels = {
        college: ['Select Year', '1st Year', '2nd Year', '3rd Year', '4th Year'],
        tvet: ['Select Year', '1st Year', '2nd Year', '3rd Year', '4th Year'],
        shs: ['Select Grade', 'Grade 11', 'Grade 12'],
        jhs: ['Select Grade', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
    };

    const semesters = ['Select Semester', '1st Semester', '2nd Semester', 'Summer'];

    // Reset form when modal is closed
    useEffect(() => {
        if (!show) {
            setStudentId('');
            setStudentData(null);
            setSubjects([]);
            setShowSubjects(false);
            setError(null);
            setSearchPerformed(false);
            setEditingMode(false);
        }
    }, [show]);

    // Fetch student data function
    const fetchStudentData = async () => {
        if (!studentId) return;

        setLoading(true);
        setError(null);
        setSearchPerformed(true);

        try {
            let docRef;
            let docSnap;
            let foundStudent = null;

            // First try searching by the formatted studentId field
            const studentsRef = collection(db, 'students');
            const studentIdQuery = query(studentsRef, where('studentId', '==', studentId));
            const querySnapshot = await getDocs(studentIdQuery);

            if (!querySnapshot.empty) {
                docSnap = querySnapshot.docs[0];
                docRef = doc(db, 'students', docSnap.id);
                foundStudent = {
                    ...docSnap.data(),
                    id: docSnap.id,
                    customizedSubjects: docSnap.data().customizedSubjects || null,
                    subjectHistory: docSnap.data().subjectHistory || [] // Initialize subject history
                };
            } else {
                // Fallback to searching by document ID
                docRef = doc(db, 'students', studentId);
                docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    foundStudent = {
                        ...docSnap.data(),
                        id: docSnap.id,
                        customizedSubjects: docSnap.data().customizedSubjects || null,
                        subjectHistory: docSnap.data().subjectHistory || [] // Initialize subject history
                    };
                }
            }

            if (foundStudent) {
                setStudentData(foundStudent);
                setStudentId(foundStudent.studentId || studentId);
                setSubjectHistory(foundStudent.subjectHistory); // Set subject history state

                // Set default course based on department
                let defaultCourse = '';
                let defaultYearLevel = '';
                const dept = foundStudent.department;

                if (dept === 'college') {
                    defaultCourse = 'BSIT';
                    defaultYearLevel = '1st Year';
                } else if (dept === 'tvet') {
                    defaultCourse = 'BTVTeD-AT';
                    defaultYearLevel = '1st Year';
                } else if (dept === 'shs') {
                    defaultCourse = 'SHS';
                    defaultYearLevel = 'Grade 11';
                } else if (dept === 'jhs') {
                    defaultCourse = 'JHS';
                    defaultYearLevel = 'Grade 7';
                }

                // Set current enrollment data if exists
                if (foundStudent.enrollment) {
                    const [from, to] = foundStudent.enrollment.schoolYear?.split('-')?.map(Number) || [];
                    setEnrollmentData({
                        course: foundStudent.enrollment.course || defaultCourse,
                        yearLevel: foundStudent.enrollment.yearLevel || defaultYearLevel,
                        semester: foundStudent.enrollment.semester || '1st Semester',
                        schoolYearFrom: from || new Date().getFullYear(),
                        schoolYearTo: to || new Date().getFullYear() + 1,
                        isIrregular: foundStudent.enrollment.isIrregular || false
                    });
                } else {
                    setEnrollmentData({
                        course: defaultCourse,
                        yearLevel: defaultYearLevel,
                        semester: '1st Semester',
                        schoolYearFrom: new Date().getFullYear(),
                        schoolYearTo: new Date().getFullYear() + 1,
                        isIrregular: false
                    });
                }

                // If student has customized subjects, load them immediately
                if (foundStudent.customizedSubjects) {
                    setSubjects(foundStudent.customizedSubjects);
                    setShowSubjects(true);
                } else if (foundStudent.enrollment) {
                    // Load standard subjects if no customized subjects exist
                    await loadSubjects(foundStudent.enrollment, foundStudent);
                }
            } else {
                setError('Student not found. Please check the ID and try again.');
            }
        } catch (err) {
            console.error('Error fetching student:', err);
            setError(`Failed to load student data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollmentChange = (e) => {
        const { name, value } = e.target;
        setEnrollmentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSchoolYearChange = (e) => {
        const { name, value } = e.target;
        const newValue = parseInt(value) || 0;

        setEnrollmentData(prev => {
            const updated = {
                ...prev,
                [name]: newValue
            };

            if (name === 'schoolYearFrom') {
                updated.schoolYearTo = newValue + 1;
            }

            return updated;
        });
    };

    const handleClearCustomization = async () => {
        if (!window.confirm('Are you sure you want to clear all customizations and revert to standard subjects?')) {
            return;
        }

        setLoading(true);
        try {
            const studentsRef = collection(db, 'students');
            const q = query(studentsRef, where('studentId', '==', studentId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Student document not found');
            }

            const docRef = querySnapshot.docs[0].ref;

            await updateDoc(docRef, {
                'enrollment.isIrregular': false,
                'customizedSubjects': null,
                updatedAt: new Date()
            });

            await loadSubjects();
            setEditingMode(false);

            toast.success('Customizations cleared successfully!', {
                position: 'top-right',
                autoClose: 3000,
            });
        } catch (err) {
            console.error('Error clearing customizations:', err);
            setError(err.message || 'Failed to clear customizations');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!studentData) throw new Error('No student data loaded');

            const studentsRef = collection(db, 'students');
            const q = query(studentsRef, where('studentId', '==', studentId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Student document not found');
            }

            const docRef = querySnapshot.docs[0].ref;

            // Prepare the update data
            const updateData = {
                enrollment: {
                    ...enrollmentData,
                    schoolYear: `${enrollmentData.schoolYearFrom}-${enrollmentData.schoolYearTo}`,
                    enrolledAt: new Date(),
                    isIrregular: editingMode
                },
                updatedAt: new Date(),
                status: 'Enrolled'
            };

            if (editingMode) {
                // Get the current subjects (either customized or standard)
                const currentSubjects = studentData.customizedSubjects || subjects;

                // Create a new history entry
                const newHistoryEntry = {
                    schoolYear: `${enrollmentData.schoolYearFrom}-${enrollmentData.schoolYearTo}`,
                    semester: enrollmentData.semester,
                    subjects: currentSubjects,
                    updatedAt: new Date()
                };

                // Add to update data
                updateData.subjectHistory = [
                    ...(studentData.subjectHistory || []),
                    newHistoryEntry
                ];
                updateData.customizedSubjects = subjects;
            }

            await updateDoc(docRef, updateData);

            const action = editingMode ? 'customized subjects for student' : 'enrolled existing student';
            logActivity(action, {
                studentId: studentData.studentId,
                studentName: `${studentData.firstName} ${studentData.lastName}`,
                course: enrollmentData.course,
                yearLevel: enrollmentData.yearLevel,
                semester: enrollmentData.semester,
                subjectCount: subjects.length,
                historyEntryAdded: editingMode
            }, auth.currentUser.displayName);

            // Refresh student data
            const updatedDoc = await getDoc(docRef);
            const updatedData = updatedDoc.data();
            setStudentData(updatedData);

            // Update local state with the new history
            if (editingMode) {
                setSubjectHistory(updatedData.subjectHistory || []);
            }

            setError(null);
            toast.success(
                <div>
                    <div>
                        {editingMode
                            ? 'Customized subjects saved successfully!'
                            : 'Enrollment updated successfully!'}
                    </div>
                    {editingMode && (
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={handlePrint}
                                style={{
                                    background: '#fff',
                                    color: '#4CAF50',
                                    border: '1px solid #4CAF50',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                <FaPrint /> Print Now
                            </button>
                        </div>
                    )}
                </div>,
                {
                    position: 'top-right',
                    autoClose: 5000,
                    closeButton: true,
                    draggable: true,
                }
            );

            setShowSubjects(true);
            if (editingMode) {
                setEditingMode(false);
            }

        } catch (err) {
            console.error('Error updating enrollment:', err);
            setError(err.message || 'Failed to update enrollment');
        } finally {
            setLoading(false);
        }
    };

    const loadSubjects = async () => {
        // if (!studentData?.enrollment) {
        //     alert('Please complete enrollment details first');
        //     return;
        // }

        setLoading(true);
        setError(null);

        try {
            if (editingMode && studentData.customizedSubjects) {
                setSubjects(studentData.customizedSubjects);
                setShowSubjects(true);
                return;
            }

            const { course, yearLevel, semester } = enrollmentData;

            // Load standard subjects for the selected course/year/semester
            const subjectsRef = collection(db, 'subjects');
            const q = query(
                subjectsRef,
                where('course', '==', course),
                where('yearLevel', '==', yearLevel),
                where('semester', '==', semester)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No subjects found for the selected course, year level, and semester');
                setSubjects([]);
                setShowSubjects(false);
                return;
            }

            // Load ALL subjects for autocomplete
            const allSubjectsQuery = query(collection(db, 'subjects'));
            const allSubjectsSnapshot = await getDocs(allSubjectsQuery);
            const allSubjects = [];

            allSubjectsSnapshot.forEach(doc => {
                const subjectData = doc.data();
                const flattenedSubjects = [
                    ...(subjectData.terms?.firstTerm || []),
                    ...(subjectData.terms?.secondTerm || []),
                    ...(subjectData.firstTerm || []),
                    ...(subjectData.secondTerm || [])
                ];

                flattenedSubjects.forEach(subject => {
                    allSubjects.push({
                        ...subject,
                        department: subjectData.department || 'college'
                    });
                });
            });

            setAvailableSubjects(allSubjects);

            const loadedSubjects = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                terms: doc.data().terms || {
                    firstTerm: doc.data().firstTerm || [],
                    secondTerm: doc.data().secondTerm || []
                }
            }));

            setSubjects(loadedSubjects);
            setShowSubjects(true);
        } catch (err) {
            console.error('Error loading subjects:', err);
            setError(`Failed to load subjects: ${err.message}`);
            setSubjects([]);
            setShowSubjects(false);
        } finally {
            setLoading(false);
        }
    };

    const toggleEditingMode = () => {
        if (editingMode) {
            handleSubmit(new Event('submit'));
        }
        setEditingMode(!editingMode);
    };

    const handleAddRow = (subjectIndex, term) => {
        const newSubjects = [...subjects];
        newSubjects[subjectIndex].terms[term].push({
            subjectCode: '',
            description: '',
            lec: '',
            lab: '',
            units: '',
            preReq: 'NONE'
        });
        setSubjects(newSubjects);
    };

    const handleDeleteRow = (subjectIndex, term, rowIndex) => {
        setSubjectToDelete({ subjectIndex, term, rowIndex });
        setShowDeleteModal(true);
    };

    const confirmDeleteRow = () => {
        if (subjectToDelete) {
            const { subjectIndex, term, rowIndex } = subjectToDelete;
            const newSubjects = [...subjects];
            newSubjects[subjectIndex].terms[term].splice(rowIndex, 1);
            setSubjects(newSubjects);
            setShowDeleteModal(false);
            setSubjectToDelete(null);
        }
    };

    const handleSubjectChange = (subjectIndex, term, rowIndex, field, value) => {
        const newSubjects = [...subjects];
        newSubjects[subjectIndex].terms[term][rowIndex][field] = value;

        if (field === 'subjectCode' && value) {
            const searchCode = value.trim().toUpperCase();
            const matchedSubject = availableSubjects.find(sub => {
                const subjectCode = sub.subjectCode?.toUpperCase().trim();
                return subjectCode === searchCode;
            });

            if (matchedSubject) {
                newSubjects[subjectIndex].terms[term][rowIndex] = {
                    ...newSubjects[subjectIndex].terms[term][rowIndex],
                    description: matchedSubject.description || 'NONE',
                    lec: matchedSubject.lec || '0',
                    lab: matchedSubject.lab || '0',
                    units: matchedSubject.units || '0',
                    preReq: matchedSubject.preReq || 'NONE'
                };
            }
        }

        setSubjects(newSubjects);
    };

    const getAvailableCourses = () => {
        if (!studentData) return [];

        switch (studentData.department) {
            case 'college': return collegeCourses;
            case 'tvet': return tvetCourses;
            case 'shs': return shsCourses;
            case 'jhs': return jhsCourses;
            default: return [];
        }
    };

    const getAvailableYearLevels = () => {
        if (!studentData) return [];

        switch (studentData.department) {
            case 'college': return yearLevels.college;
            case 'tvet': return yearLevels.tvet;
            case 'shs': return yearLevels.shs;
            case 'jhs': return yearLevels.jhs;
            default: return [];
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const studentName = `${studentData.lastName}, ${studentData.firstName} ${studentData.middleName?.charAt(0) || ''}.`;
        const schoolYear = studentData.enrollment?.schoolYear || '2025-2026';

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
                font-size: 12px;
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
                <td>${studentData.status || 'Enrolled'}</td>
                </tr>
                <tr>
                <td class="info-label">Full Name:</td>
                <td>${studentData.lastName}, ${studentData.firstName}${studentData.middleName ? ` ${studentData.middleName.charAt(0)}.` : ''}</td>
                </tr>
                <tr>
                <td class="info-label">Course:</td>
                <td>${studentData.enrollment?.course || 'Not enrolled'}</td>
                <td class="info-label">Year Level:</td>
                <td>${studentData.enrollment?.yearLevel || 'Not enrolled'}</td>
                <td class="info-label">Semester:</td>
                <td>${studentData.enrollment?.semester || 'Not enrolled'}</td>
                </tr>
            </table>
            
            <div class="subjects-title">ENROLLED SUBJECTS</div>
            
            ${subjects.map(subject => {
            const firstTermTotal = subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            const secondTermTotal = subject.terms.secondTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            const combinedTotal = firstTermTotal + secondTermTotal;

            return `
                <div class="compact-row">
                ${subject.terms.firstTerm.length > 0 ? `
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
                
                ${subject.terms.secondTerm.length > 0 ? `
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
                
                ${studentData.enrollment?.semester === 'Summer' && subject.terms.firstTerm.length > 0 ? `
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
                <div class="footer-line">${studentData.lastName}, ${studentData.firstName}${studentData.middleName ? ` ${studentData.middleName.charAt(0)}.` : ''}</div>
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
                <td>${studentData.status || 'Enrolled'}</td>
                </tr>
                <tr>
                <td class="info-label">Full Name:</td>
                <td>${studentData.lastName}, ${studentData.firstName}${studentData.middleName ? ` ${studentData.middleName.charAt(0)}.` : ''}</td>
                </tr>
                <tr>
                <td class="info-label">Course:</td>
                <td>${studentData.enrollment?.course || 'Not enrolled'}</td>
                <td class="info-label">Year Level:</td>
                <td>${studentData.enrollment?.yearLevel || 'Not enrolled'}</td>
                <td class="info-label">Semester:</td>
                <td>${studentData.enrollment?.semester || 'Not enrolled'}</td>
                </tr>
            </table>
            
            <div class="subjects-title">ENROLLED SUBJECTS</div>
            
            ${subjects.map(subject => {
            const firstTermTotal = subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            const secondTermTotal = subject.terms.secondTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            const combinedTotal = firstTermTotal + secondTermTotal;

            return `
                <div class="compact-row">
                ${subject.terms.firstTerm.length > 0 ? `
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
                
                ${subject.terms.secondTerm.length > 0 ? `
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
                
                ${studentData.enrollment?.semester === 'Summer' && subject.terms.firstTerm.length > 0 ? `
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
                                <div class="footer-line">${studentData.lastName}, ${studentData.firstName}${studentData.middleName ? ` ${studentData.middleName.charAt(0)}.` : ''}</div>
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

    if (!show) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Enroll Existing Student</h3>
                    <div className={styles.headerButtons}>
                        {showSubjects && (
                            <button
                                className={styles.printButton}
                                onClick={handlePrint}
                                title="Print Details"
                            >
                                <FaPrint /> Print Details
                            </button>
                        )}
                        <button className={styles.closeButton} onClick={onClose}>&times;</button>
                    </div>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.errorContainer}>
                            <div className={styles.error}>{error}</div>
                        </div>
                    )}

                    {!studentData ? (
                        <StudentSearchForm
                            studentId={studentId}
                            setStudentId={setStudentId}
                            fetchStudentData={fetchStudentData}
                            loading={loading}
                            searchPerformed={searchPerformed}
                        />
                    ) : (
                        <div className={styles.enrollmentContainer}>
                            <EnrollmentForm
                                studentData={studentData}
                                enrollmentData={enrollmentData}
                                handleEnrollmentChange={handleEnrollmentChange}
                                handleSchoolYearChange={handleSchoolYearChange}
                                handleSubmit={handleSubmit}
                                loading={loading}
                                getAvailableCourses={getAvailableCourses}
                                getAvailableYearLevels={getAvailableYearLevels}
                                semesters={semesters}
                            />

                            <StudentDetailsSection
                                studentData={studentData}
                                loadSubjects={loadSubjects}
                                loading={loading}
                            />
                        </div>
                    )}

                    <SubjectsDisplay
                        showSubjects={showSubjects}
                        subjects={subjects}
                        subjectHistory={subjectHistory}
                        enrollmentData={enrollmentData}
                        editingMode={editingMode}
                        toggleEditingMode={toggleEditingMode}
                        handleClearCustomization={handleClearCustomization}
                        loading={loading}
                        handleAddRow={handleAddRow}
                        handleSubjectChange={handleSubjectChange}
                        handleDeleteRow={handleDeleteRow}
                        showDeleteModal={showDeleteModal}
                        setShowDeleteModal={setShowDeleteModal}
                        confirmDeleteRow={confirmDeleteRow}
                        subjectToDelete={subjectToDelete}
                    />
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExistingStudentEnrollment;