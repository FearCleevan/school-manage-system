//src/components/payment/PaymentDetails.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './PaymentDetails.module.css';
import { db } from '../../lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import BalanceBreakdown from './Navbar/BalanceBreakdown';
import PaymentHistory from './Navbar/PaymentHistory';
import SubjectLoad from './Navbar/SubjectLoad';
import AddPayment from '../modals/AddPayment/AddPayment';

const PaymentDetails = ({ student, onClose }) => {
    const [activeTab, setActiveTab] = useState('balance');
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const feeStructure = useMemo(() => ({
        college: {
            name: "College",
            perUnit: 365,
            miscFee: 2500,
            labFeePerUnit: 150,
            libraryFee: 500,
            athleticFee: 200,
            medicalFee: 300,
            registrationFee: 1000
        },
        tvet: {
            name: "TVET",
            perUnit: 320,
            miscFee: 2000,
            labFeePerUnit: 200,
            libraryFee: 400,
            athleticFee: 150,
            medicalFee: 250,
            registrationFee: 800
        },
        shs: {
            name: "Senior High School",
            perUnit: 0,
            fixedFee: 8000,
            miscFee: 1500,
            libraryFee: 300,
            athleticFee: 100,
            medicalFee: 200,
            registrationFee: 500
        },
        jhs: {
            name: "Junior High School",
            perUnit: 0,
            fixedFee: 6000,
            miscFee: 1200,
            libraryFee: 250,
            athleticFee: 80,
            medicalFee: 150,
            registrationFee: 400
        }
    }), []);

 // In PaymentDetails.jsx
const calculateBalance = useCallback((subjectsList) => {
    if (!student || !student.enrollment) return null;

    const department = student.department || 'college';
    const fees = feeStructure[department] || feeStructure.college;
    
    // Calculate units (same as SubjectLoad)
    let totalUnits = 0;
    let labUnits = 0;
    
    subjectsList.forEach(subject => {
        if (subject.units) {
            totalUnits += parseFloat(subject.units) || 0;
            labUnits += parseFloat(subject.lab) || 0;
        }
        else if (subject.terms) {
            Object.values(subject.terms).forEach(term => {
                term.forEach(course => {
                    totalUnits += parseFloat(course.units) || 0;
                    labUnits += parseFloat(course.lab) || 0;
                });
            });
        }
        else if (Array.isArray(subject)) {
            subject.forEach(course => {
                totalUnits += parseFloat(course.units) || 0;
                labUnits += parseFloat(course.lab) || 0;
            });
        }
    });

    const isEnrolled = student.enrollment.course !== 'Not enrolled';
    const hasSubjects = subjectsList.length > 0;

    let tuitionFee = 0;
    if (isEnrolled && hasSubjects) {
        tuitionFee = (department === 'shs' || department === 'jhs') 
            ? fees.fixedFee 
            : totalUnits * fees.perUnit;
    } else if (isEnrolled) {
        tuitionFee = fees.registrationFee;
    }

    const labFee = labUnits * (fees.labFeePerUnit || 0);

    return {
        departmentName: fees.name,
        tuitionFee,
        miscFee: isEnrolled ? fees.miscFee : 0,
        labFee,
        otherFees: [
            { name: 'Library Fee', amount: fees.libraryFee },
            { name: 'Medical Fee', amount: fees.medicalFee },
            { name: 'Athletic Fee', amount: fees.athleticFee }
        ],
        discount: student.discount || 0,
        totalUnits,
        labUnits,
        isEnrolled,
        hasSubjects,
        perUnitRate: fees.perUnit,
        labUnitRate: fees.labFeePerUnit,
        currentBalance: student.balance || 0
    };
}, [student, feeStructure]);

    const fetchEnrolledSubjects = useCallback(async () => {
        if (!student || !student.enrollment || student.enrollment.course === 'Not enrolled') {
            setLoading(false);
            return;
        }

        try {
            if (student.customizedSubjects) {
                setSubjects(student.customizedSubjects);
                return;
            }

            if (student.enrolledSubjects?.length > 0) {
                const subjectPromises = student.enrolledSubjects.map(async (subjectId) => {
                    const subjectDoc = await getDocs(query(
                        collection(db, 'subjects'),
                        where('__name__', '==', subjectId)
                    ));
                    return subjectDoc.docs[0]?.data();
                });

                const subjectsData = (await Promise.all(subjectPromises)).filter(Boolean);
                setSubjects(subjectsData);
            } else {
                const q = query(
                    collection(db, 'subjects'),
                    where('course', '==', student.enrollment.course),
                    where('yearLevel', '==', student.enrollment.yearLevel),
                    where('semester', '==', student.enrollment.semester)
                );

                const querySnapshot = await getDocs(q);
                const subjectsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    terms: doc.data().terms || {
                        firstTerm: doc.data().firstTerm || [],
                        secondTerm: doc.data().secondTerm || []
                    }
                }));
                setSubjects(subjectsData);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    }, [student]);

    useEffect(() => {
        fetchEnrolledSubjects();
    }, [fetchEnrolledSubjects, refreshKey]);

    const handlePaymentSuccess = () => {
        setRefreshKey(prev => prev + 1); // Trigger refresh
    };

    const formatFullName = (student) => {
        return `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}`;
    };

    if (!student) return null;

    return (
        <div className={styles.modalOverlay}>
            {showAddPayment && (
                <AddPayment
                    student={student}
                    onClose={() => setShowAddPayment(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2>Payment Details</h2>
                    <div className={styles.headerButtons}>
                        <button
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Close payment details"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className={styles.modalContent}>
                    {/* Student Profile */}
                    <div className={styles.studentDetails}>
                        <div className={styles.profileSection}>
                            {student.profilePhoto ? (
                                <img
                                    src={student.profilePhoto}
                                    alt={`${student.firstName} ${student.lastName}'s profile`}
                                    className={styles.profileImage}
                                />
                            ) : (
                                <div className={styles.profilePlaceholder}>
                                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                </div>
                            )}
                            <h3 className={styles.studentName}>{formatFullName(student)}</h3>
                        </div>

                        <div className={styles.detailsList}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Student ID:</span>
                                <span className={styles.detailValue}>{student.studentId}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Course:</span>
                                <span className={styles.detailValue}>
                                    {student.enrollment?.course || 'Not enrolled'}
                                </span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Year:</span>
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
                                <span className={styles.detailLabel}>Status:</span>
                                <span className={`${styles.detailValue} ${styles.statusBadge} ${student.status?.toLowerCase()}`}>
                                    {student.status || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={styles.paymentContent}>
                        <div className={styles.paymentTabs}>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'balance' ? styles.active : ''}`}
                                onClick={() => setActiveTab('balance')}
                            >
                                Balance Breakdown
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                Payment History
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'subjects' ? styles.active : ''}`}
                                onClick={() => setActiveTab('subjects')}
                            >
                                Subject Load
                            </button>
                        </div>

                        {loading ? (
                            <div className={styles.loading}>
                                <div className={styles.loadingSpinner}></div>
                                Loading payment details...
                            </div>
                        ) : (
                            <>
                                {activeTab === 'balance' && (
                                    <BalanceBreakdown
                                        student={student}
                                        subjects={subjects}
                                        calculateBalance={calculateBalance}
                                        onMakePayment={() => setShowAddPayment(true)}
                                    />
                                )}
                                {activeTab === 'history' && (
                                    <PaymentHistory
                                        student={student}
                                        refreshData={handlePaymentSuccess}
                                    />
                                )}
                                {activeTab === 'subjects' && (
                                    <SubjectLoad student={student} subjects={subjects} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetails;