import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import styles from './ExistingStudentEnroll.module.css';
import { FaPrint } from 'react-icons/fa';

const ExistingStudentEnrollment = ({ show, onClose }) => {
  const [studentId, setStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [showSubjects, setShowSubjects] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [enrollmentData, setEnrollmentData] = useState({
    course: '',
    yearLevel: '',
    semester: '',
    schoolYearFrom: new Date().getFullYear(),
    schoolYearTo: new Date().getFullYear() + 1
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
    }
  }, [show]);

  // Enhanced fetch student data function
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
        // Found by formatted studentId
        docSnap = querySnapshot.docs[0];
        docRef = doc(db, 'students', docSnap.id);
        foundStudent = docSnap.data();
      } else {
        // Fallback to searching by document ID
        docRef = doc(db, 'students', studentId);
        docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          foundStudent = docSnap.data();
        }
      }

      if (foundStudent) {
        setStudentData(foundStudent);
        // Display the formatted studentId if available, otherwise use what was searched
        setStudentId(foundStudent.studentId || studentId);

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
          const [from, to] = foundStudent.enrollment.schoolYear.split('-').map(Number);
          setEnrollmentData({
            course: foundStudent.enrollment.course || defaultCourse,
            yearLevel: foundStudent.enrollment.yearLevel || defaultYearLevel,
            semester: foundStudent.enrollment.semester || '1st Semester',
            schoolYearFrom: from || new Date().getFullYear(),
            schoolYearTo: to || new Date().getFullYear() + 1
          });
        } else {
          setEnrollmentData({
            course: defaultCourse,
            yearLevel: defaultYearLevel,
            semester: '1st Semester',
            schoolYearFrom: new Date().getFullYear(),
            schoolYearTo: new Date().getFullYear() + 1
          });
        }
      } else {
        setError('Student not found. Please check the ID and try again.');
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to fetch student data. Please try again.');
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

      // Ensure to is always 1 more than from
      if (name === 'schoolYearFrom') {
        updated.schoolYearTo = newValue + 1;
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowSubjects(false);

    try {
      if (!studentData) throw new Error('No student data loaded');

      // First try to find the document by studentId field
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Student document not found');
      }

      // Get the first matching document (there should only be one)
      const docRef = querySnapshot.docs[0].ref;

      await updateDoc(docRef, {
        enrollment: {
          ...enrollmentData,
          schoolYear: `${enrollmentData.schoolYearFrom}-${enrollmentData.schoolYearTo}`,
          enrolledAt: new Date()
        },
        updatedAt: new Date(),
        status: 'Enrolled'
      });

      // Refresh student data
      const updatedDoc = await getDoc(docRef);
      setStudentData(updatedDoc.data());

      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error updating enrollment:', err);
      setError(err.message || 'Failed to update enrollment');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSubjects = async () => {
    if (!studentData?.enrollment) {
      alert('Please complete enrollment details first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { course, yearLevel, semester } = enrollmentData;

      // Query subjects that match the course, year level, and semester
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

      // Process the subjects data
      const loadedSubjects = [];
      querySnapshot.forEach((doc) => {
        const subjectData = doc.data();
        loadedSubjects.push({
          id: doc.id,
          subjectName: subjectData.subjectName,
          subjectCode: subjectData.subjectCode,
          terms: subjectData.terms || {
            firstTerm: [],
            secondTerm: []
          }
        });
      });

      setSubjects(loadedSubjects);
      setShowSubjects(true);
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError('Failed to load subjects. Please try again.');
      setSubjects([]);
      setShowSubjects(false);
    } finally {
      setLoading(false);
    }
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
              <title>Student Enrollment Details</title>
              <style>
                @page {
                  size: A4;
                  margin: 1cm;
                }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0;
                  padding: 0;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 20px;
                  padding-bottom: 10px;
                  border-bottom: 2px solid #333;
                }
                .school-info {
                  text-align: right;
                }
                .school-name {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .school-address {
                  font-size: 12px;
                }
                .logo {
                  height: 80px;
                  width: auto;
                }
                .registration-title {
                  text-align: center;
                  font-size: 16px;
                  font-weight: bold;
                  margin: 15px 0;
                  text-decoration: underline;
                }
                .student-info {
                  width: 100%;
                  margin-bottom: 20px;
                }
                .student-info-row {
                  display: flex;
                  margin-bottom: 8px;
                }
                .info-label {
                  font-weight: bold;
                  min-width: 120px;
                }
                .subjects-title {
                  text-align: center;
                  font-weight: bold;
                  margin: 20px 0 10px 0;
                  padding-bottom: 5px;
                  border-bottom: 1px solid #000;
                }
                .subject-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
                .subject-table th, .subject-table td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                .subject-table th {
                  background-color: #f2f2f2;
                  text-align: center;
                }
                .term-title {
                  background-color: #f5f5f5;
                  padding: 5px 10px;
                  margin: 20px 0 10px 0;
                  text-align: center;
                }
                .total-units {
                  text-align: right;
                  font-weight: bold;
                  margin-bottom: 20px;
                }
                .footer {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 40px;
                  font-size: 12px;
                }
                .footer-section {
                  width: 23%;
                }
                .footer-label {
                  font-weight: bold;
                  margin-bottom: 30px;
                }
                .footer-line {
                  border-top: 1px solid #000;
                  padding-top: 5px;
                  margin-top: 30px;
                }
                .page-break {
                  page-break-after: always;
                }
                .copy-title {
                  text-align: center;
                  font-weight: bold;
                  margin: 20px 0;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <!-- Student's Copy -->
              <div class="copy-title">STUDENT'S COPY</div>
              
              <div class="header">
                <img src="/school-logo.png" class="logo" alt="School Logo">
                <div class="school-info">
                  <div class="school-name">SAMPLE POLYTECHNIC COLLEGE</div>
                  <div class="school-address">123 Education St., Learning City, 2000</div>
                </div>
              </div>
              
              <div class="registration-title">REGISTRATION DETAILS</div>
              
              <table class="student-info">
                <tr class="student-info-row">
                  <td class="info-label">Date of Admission/Enrollment:</td>
                  <td>${currentDate}</td>
                  <td class="info-label">School Year:</td>
                  <td>${schoolYear}</td>
                  <td class="info-label">Status:</td>
                  <td>${studentData.status || 'Enrolled'}</td>
                </tr>
                <tr class="student-info-row">
                  <td class="info-label">Family Name:</td>
                  <td>${studentData.lastName}</td>
                  <td class="info-label">First Name:</td>
                  <td>${studentData.firstName}</td>
                  <td class="info-label">Middle Name:</td>
                  <td>${studentData.middleName || ''}</td>
                </tr>
                <tr class="student-info-row">
                  <td class="info-label">Course:</td>
                  <td>${studentData.enrollment?.course || 'Not enrolled'}</td>
                  <td class="info-label">Year Level:</td>
                  <td>${studentData.enrollment?.yearLevel || 'Not enrolled'}</td>
                  <td class="info-label">Semester:</td>
                  <td>${studentData.enrollment?.semester || 'Not enrolled'}</td>
                </tr>
              </table>
              
              <div class="subjects-title">ENROLLED SUBJECTS</div>
              
              ${subjects.map(subject => `
                <div>
                  ${subject.terms.firstTerm.length > 0 ? `
                    <div class="term-title">FIRST TERM</div>
                    <table class="subject-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th>Days</th>
                          <th>Time</th>
                          <th>Room No.</th>
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
                      </tbody>
                    </table>
                    <div class="total-units">
                      Total Units: ${subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0, 0))}
                    </div>
                  ` : ''}
                  
                  ${subject.terms.secondTerm.length > 0 ? `
                    <div class="term-title">SECOND TERM</div>
                    <table class="subject-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th>Days</th>
                          <th>Time</th>
                          <th>Room No.</th>
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
                      </tbody>
                    </table>
                    <div class="total-units">
                      Total Units: ${subject.terms.secondTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0, 0))}
                    </div>
                  ` : ''}
                  
                  ${studentData.enrollment?.semester === 'Summer' ? `
                    <div class="term-title">SUMMER</div>
                    <table class="subject-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th>Days</th>
                          <th>Time</th>
                          <th>Room No.</th>
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
                      </tbody>
                    </table>
                    <div class="total-units">
                      Total Units: ${subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0, 0))}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
              
              <div class="footer">
                <div class="footer-section">
                  <div class="footer-label">Confirmed By:</div>
                  <div>Student's Signature / Date:</div>
                  <div class="footer-line"></div>
                </div>
                <div class="footer-section">
                  <div class="footer-label">Approved By:</div>
                  <div>Program Head Dean of College / Date:</div>
                  <div class="footer-line"></div>
                </div>
                <div class="footer-section">
                  <div class="footer-label">Assisted By:</div>
                  <div>Cashier / Date</div>
                  <div class="footer-line"></div>
                </div>
                <div class="footer-section">
                  <div class="footer-label">Copy Received By:</div>
                  <div>Registrar / Date</div>
                  <div class="footer-line"></div>
                </div>
              </div>
              
              <!-- Registrar's Copy -->
              <div class="page-break"></div>
              <div class="copy-title">REGISTRAR'S COPY</div>
              
              <!-- Repeat all content for registrar's copy -->
              <div class="header">
                <img src="/school-logo.png" class="logo" alt="School Logo">
                <div class="school-info">
                  <div class="school-name">SAMPLE POLYTECHNIC COLLEGE</div>
                  <div class="school-address">123 Education St., Learning City, 2000</div>
                </div>
              </div>
              
              <div class="registration-title">REGISTRATION DETAILS</div>
              
              <table class="student-info">
                <tr class="student-info-row">
                  <td class="info-label">Date of Admission/Enrollment:</td>
                  <td>${currentDate}</td>
                  <td class="info-label">School Year:</td>
                  <td>${schoolYear}</td>
                  <td class="info-label">Status:</td>
                  <td>${studentData.status || 'Enrolled'}</td>
                </tr>
                <tr class="student-info-row">
                  <td class="info-label">Family Name:</td>
                  <td>${studentData.lastName}</td>
                  <td class="info-label">First Name:</td>
                  <td>${studentData.firstName}</td>
                  <td class="info-label">Middle Name:</td>
                  <td>${studentData.middleName || ''}</td>
                </tr>
                <tr class="student-info-row">
                  <td class="info-label">Course:</td>
                  <td>${studentData.enrollment?.course || 'Not enrolled'}</td>
                  <td class="info-label">Year Level:</td>
                  <td>${studentData.enrollment?.yearLevel || 'Not enrolled'}</td>
                  <td class="info-label">Semester:</td>
                  <td>${studentData.enrollment?.semester || 'Not enrolled'}</td>
                </tr>
              </table>
              
              <div class="subjects-title">ENROLLED SUBJECTS</div>
              
              ${subjects.map(subject => `
                <div>
                  ${subject.terms.firstTerm.length > 0 ? `
                    <div class="term-title">FIRST TERM</div>
                    <table class="subject-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th>Days</th>
                          <th>Time</th>
                          <th>Room No.</th>
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
                      </tbody>
                    </table>
                    <div class="total-units">
                      Total Units: ${subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0, 0))}
                    </div>
                  ` : ''}
                  
                  ${subject.terms.secondTerm.length > 0 ? `
                    <div class="term-title">SECOND TERM</div>
                    <table class="subject-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th>Days</th>
                          <th>Time</th>
                          <th>Room No.</th>
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
                      </tbody>
                    </table>
                    <div class="total-units">
                      Total Units: ${subject.terms.secondTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0, 0))}
                    </div>
                  ` : ''}
                  
                  ${studentData.enrollment?.semester === 'Summer' ? `
                    <div class="term-title">SUMMER</div>
                    <table class="subject-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Description</th>
                          <th>Lec</th>
                          <th>Lab</th>
                          <th>Units</th>
                          <th>Days</th>
                          <th>Time</th>
                          <th>Room No.</th>
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
                      </tbody>
                    </table>
                    <div class="total-units">
                      Total Units: ${subject.terms.firstTerm.reduce((sum, course) => sum + (parseFloat(course.units) || 0, 0))}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
              
              <div class="footer">
                <div class="footer-section">
                  <div class="footer-label">Confirmed By:</div>
                  <div>Student's Signature / Date:</div>
                  <div class="footer-line"></div>
                </div>
                <div class="footer-section">
                  <div class="footer-label">Approved By:</div>
                  <div>Program Head Dean of College / Date:</div>
                  <div class="footer-line"></div>
                </div>
                <div class="footer-section">
                  <div class="footer-label">Assisted By:</div>
                  <div>Cashier / Date</div>
                  <div class="footer-line"></div>
                </div>
                <div class="footer-section">
                  <div class="footer-label">Copy Received By:</div>
                  <div>Registrar / Date</div>
                  <div class="footer-line"></div>
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
            <div className={styles.searchContainer}>
              <div className={styles.studentIdInput}>
                <label htmlFor="existingStudentId" className={styles.formLabel}>
                  Enter Student ID
                </label>
                <input
                  id="existingStudentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={styles.formInput}
                  placeholder="e.g., SPC25-0001"
                />
                <button
                  className={styles.searchBtn}
                  onClick={fetchStudentData}
                  disabled={!studentId.trim() || loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              {searchPerformed && !loading && !studentData && (
                <p className={styles.notFoundMessage}>Student not found. Please check the ID and try again.</p>
              )}
            </div>
          ) : (
            <div className={styles.enrollmentContainer}>
              <div className={styles.enrollmentForm}>
                <div className={styles.profileSection}>
                  {studentData.profilePhoto ? (
                    <img
                      src={studentData.profilePhoto}
                      alt="Profile"
                      className={styles.profileImage}
                    />
                  ) : (
                    <div className={styles.profilePlaceholder}>
                      <span>{studentData.firstName.charAt(0)}{studentData.lastName.charAt(0)}</span>
                    </div>
                  )}
                  <h4 className={styles.studentName}>
                    {studentData.firstName} {studentData.lastName}
                  </h4>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Course *</label>
                  <select
                    name="course"
                    value={enrollmentData.course}
                    onChange={handleEnrollmentChange}
                    className={`${styles.formInput} ${styles.formSelect}`}
                    disabled={loading}
                  >
                    {getAvailableCourses().map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Year Level *</label>
                  <select
                    name="yearLevel"
                    value={enrollmentData.yearLevel}
                    onChange={handleEnrollmentChange}
                    className={`${styles.formInput} ${styles.formSelect}`}
                    disabled={loading}
                  >
                    {getAvailableYearLevels().map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Semester *</label>
                  <select
                    name="semester"
                    value={enrollmentData.semester}
                    onChange={handleEnrollmentChange}
                    className={`${styles.formInput} ${styles.formSelect}`}
                    disabled={loading}
                  >
                    {semesters.map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>School Year *</label>
                  <div className={styles.schoolYearInputs}>
                    <input
                      type="number"
                      name="schoolYearFrom"
                      value={enrollmentData.schoolYearFrom}
                      onChange={handleSchoolYearChange}
                      className={styles.formInput}
                      disabled={loading}
                    />
                    <span className={styles.schoolYearSeparator}>-</span>
                    <input
                      type="number"
                      name="schoolYearTo"
                      value={enrollmentData.schoolYearTo}
                      onChange={handleSchoolYearChange}
                      className={styles.formInput}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={loading || !enrollmentData.course || !enrollmentData.yearLevel || !enrollmentData.semester}
                >
                  {loading ? 'Updating...' : 'Submit Enrollment'}
                </button>
              </div>

              <div className={styles.studentDetails}>
                <h3 className={styles.sectionTitle}>Student Details</h3>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>ID:</span>
                  <span className={styles.detailValue}>{studentData.studentId || studentId}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Department:</span>
                  <span className={styles.detailValue}>
                    {studentData.department === 'college' ? 'College' :
                      studentData.department === 'tvet' ? 'TVET' :
                        studentData.department === 'shs' ? 'Senior High School' :
                          studentData.department === 'jhs' ? 'Junior High School' : ''}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Course:</span>
                  <span className={styles.detailValue}>
                    {studentData.enrollment?.course || 'Not enrolled'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Year Level:</span>
                  <span className={styles.detailValue}>
                    {studentData.enrollment?.yearLevel || 'Not enrolled'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Semester:</span>
                  <span className={styles.detailValue}>
                    {studentData.enrollment?.semester || 'Not enrolled'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>School Year:</span>
                  <span className={styles.detailValue}>
                    {studentData.enrollment?.schoolYear || 'Not enrolled'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Full Name:</span>
                  <span className={styles.detailValue}>
                    {`${studentData.firstName} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName}`}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{studentData.email}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{studentData.phone}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Address:</span>
                  <span className={styles.detailValue}>
                    {`${studentData.address?.street}, ${studentData.address?.city}, ${studentData.address?.province}`}
                  </span>
                </div>

                {studentData.enrollment && (
                  <button
                    type="button"
                    className={styles.loadSubjectsBtn}
                    onClick={loadSubjects}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load Subjects'}
                  </button>
                )}
              </div>
            </div>
          )}

          {showSubjects && subjects.length > 0 && (
            <div className={styles.subjectsContainer}>
              <h4 className={styles.subjectsTitle}>
                Subjects for {enrollmentData.course} - {enrollmentData.yearLevel} - {enrollmentData.semester}
              </h4>

              {subjects.map((subject, index) => (
                <div key={index} className={styles.subjectGroup}>
                  {subject.terms.firstTerm.length > 0 && (
                    <div className={styles.termContainer}>
                      <h6 className={styles.termTitle}>First Term</h6>
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
                    </div>
                  )}

                  {subject.terms.secondTerm.length > 0 && (
                    <div className={styles.termContainer}>
                      <h6 className={styles.termTitle}>Second Term</h6>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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