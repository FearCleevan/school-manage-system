import React, { useCallback, useEffect, useState } from 'react';
import styles from './BalanceBreakdown.module.css';
import { FaFileInvoiceDollar, FaMoneyBillWave, FaWallet, FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

const BalanceBreakdown = ({ student, subjects, onMakePayment, refreshData }) => {
    const [balanceData, setBalanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [feeStructure, setFeeStructure] = useState(null);
    const [error, setError] = useState(null);

    // Load fee structure from Firestore with error handling
    useEffect(() => {
        const loadFeeStructure = async () => {
            try {
                const feeDoc = await getDoc(doc(db, 'system', 'feeStructure'));
                if (feeDoc.exists()) {
                    setFeeStructure(feeDoc.data());
                } else {
                    console.warn('Fee structure not found in database');
                    // Use default fee structure as fallback
                    setFeeStructure({
                        college: {
                            name: 'College',
                            perUnit: 1000,
                            labFeePerUnit: 500,
                            miscFee: 5000,
                            libraryFee: 1000,
                            medicalFee: 500,
                            athleticFee: 500,
                            registrationFee: 2000
                        },
                        shs: {
                            name: 'Senior High School',
                            fixedFee: 15000,
                            miscFee: 3000,
                            libraryFee: 800,
                            medicalFee: 400,
                            athleticFee: 400
                        },
                        jhs: {
                            name: 'Junior High School',
                            fixedFee: 12000,
                            miscFee: 2500,
                            libraryFee: 600,
                            medicalFee: 300,
                            athleticFee: 300
                        },
                        tvet: {
                            name: 'TVET',
                            perUnit: 1200,
                            labFeePerUnit: 600,
                            miscFee: 4000,
                            libraryFee: 900,
                            medicalFee: 450,
                            athleticFee: 450,
                            registrationFee: 2500
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading fee structure:', error);
                setError('Failed to load fee structure');
            }
        };
        loadFeeStructure();
    }, []);

    // Calculate fees locally (fallback when Firestore writes fail)
    const calculateFeesLocally = useCallback((student, subjects, feeStructure) => {
        if (!student || !feeStructure) return null;

        const department = student.department || 'college';
        const fees = feeStructure[department] || feeStructure.college;

        let totalUnits = 0;
        let labUnits = 0;
        let tuitionFee = 0;

        const isEnrolled = student.enrollment?.course !== 'Not enrolled';
        const hasSubjects = subjects && subjects.length > 0;

        // Calculate units and fees
        if (isEnrolled && hasSubjects) {
            subjects.forEach(subject => {
                if (subject.units) {
                    const units = parseFloat(subject.units) || 0;
                    totalUnits += units;
                    const lab = parseFloat(subject.lab) || 0;
                    labUnits += lab;
                } else if (subject.terms) {
                    Object.values(subject.terms).forEach(term => {
                        term.forEach(course => {
                            const units = parseFloat(course.units) || 0;
                            totalUnits += units;
                            const lab = parseFloat(course.lab) || 0;
                            labUnits += lab;
                        });
                    });
                }
            });

            if (department === 'shs' || department === 'jhs') {
                tuitionFee = fees.fixedFee || 0;
            } else {
                tuitionFee = totalUnits * (fees.perUnit || 0);
            }
        } else if (isEnrolled) {
            tuitionFee = fees.registrationFee || 0;
        }

        const labFee = labUnits * (fees.labFeePerUnit || 0);
        const miscFee = isEnrolled ? (fees.miscFee || 0) : 0;
        const otherFees = [
            { name: 'Library Fee', amount: fees.libraryFee || 0 },
            { name: 'Medical Fee', amount: fees.medicalFee || 0 },
            { name: 'Athletic Fee', amount: fees.athleticFee || 0 }
        ];

        const totalOtherFees = otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        const discount = student.discount || 0;
        
        const totalFees = Math.max(0, tuitionFee + miscFee + labFee + totalOtherFees - discount);
        
        // Calculate total paid from payment history - ensure we're using the latest data
        const totalPaid = student.paymentHistory?.reduce((sum, payment) => {
            return payment.status === 'completed' ? sum + (parseFloat(payment.amount) || 0) : sum;
        }, 0) || 0;

        const remainingBalance = Math.max(0, totalFees - totalPaid);

        return {
            financialSummary: {
                totalTuition: tuitionFee,
                totalFees: tuitionFee + miscFee + labFee + totalOtherFees,
                totalDiscount: discount,
                totalAmountDue: totalFees,
                totalPaid: totalPaid,
                remainingBalance: remainingBalance,
                lastUpdated: new Date()
            },
            feeBreakdown: {
                tuitionFee,
                miscFee,
                labFee,
                otherFees,
                discount,
                totalUnits,
                labUnits,
                perUnitRate: fees.perUnit || 0,
                labUnitRate: fees.labFeePerUnit || 0,
                calculationDate: new Date(),
                isEnrolled,
                hasSubjects
            }
        };
    }, []);

    // Calculate and store fees in Firestore (with fallback)
    const calculateAndStoreFees = useCallback(async (student, subjects, feeStructure) => {
        if (!student || !feeStructure) return null;

        setCalculating(true);
        setError(null);
        
        try {
            const calculatedData = calculateFeesLocally(student, subjects, feeStructure);
            
            if (!calculatedData) {
                throw new Error('Failed to calculate fees');
            }

            // Try to store in Firestore, but continue even if it fails
            try {
                const studentRef = doc(db, 'students', student.id);
                await updateDoc(studentRef, {
                    financialSummary: calculatedData.financialSummary,
                    feeBreakdown: calculatedData.feeBreakdown
                });

                // Store calculation history
                await addDoc(collection(db, 'feeCalculations'), {
                    studentId: student.id,
                    calculationDate: new Date(),
                    subjects: subjects || [],
                    feeStructure: feeStructure[student.department] || feeStructure.college,
                    breakdown: calculatedData.feeBreakdown,
                    totals: calculatedData.financialSummary
                });

                console.log('Fees calculated and stored successfully');
            } catch (firestoreError) {
                console.warn('Could not store fees in Firestore, using local calculation:', firestoreError);
                // Continue with local calculation even if Firestore fails
            }

            return calculatedData;

        } catch (error) {
            console.error('Error calculating fees:', error);
            setError('Failed to calculate fees. Using last known data.');
            throw error;
        } finally {
            setCalculating(false);
        }
    }, [calculateFeesLocally]);

    // Load or calculate balance data
    useEffect(() => {
        const loadBalanceData = async () => {
            if (!student || !feeStructure) return;

            try {
                setLoading(true);
                setError(null);

                // Try to get existing data from Firestore first
                let studentData = null;
                try {
                    const studentDoc = await getDoc(doc(db, 'students', student.id));
                    if (studentDoc.exists()) {
                        studentData = studentDoc.data();
                    }
                } catch (firestoreError) {
                    console.warn('Could not load student data from Firestore:', firestoreError);
                }

                const hasRecentCalculation = studentData?.feeBreakdown?.calculationDate && 
                    (new Date() - studentData.feeBreakdown.calculationDate.toDate()) < (24 * 60 * 60 * 1000);

                if (hasRecentCalculation && studentData.financialSummary) {
                    // Use stored data
                    setBalanceData({
                        ...studentData.feeBreakdown,
                        financialSummary: studentData.financialSummary
                    });
                    setLoading(false);
                } else {
                    // Calculate fresh
                    const calculatedData = await calculateAndStoreFees(student, subjects, feeStructure);
                    if (calculatedData) {
                        setBalanceData({
                            ...calculatedData.feeBreakdown,
                            financialSummary: calculatedData.financialSummary
                        });
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error loading balance data:', error);
                // Fallback to local calculation only
                const localData = calculateFeesLocally(student, subjects, feeStructure);
                if (localData) {
                    setBalanceData({
                        ...localData.feeBreakdown,
                        financialSummary: localData.financialSummary
                    });
                }
                setLoading(false);
            }
        };

        loadBalanceData();
    }, [student, subjects, feeStructure, calculateAndStoreFees, calculateFeesLocally]);

    // Sync with payment history changes
    useEffect(() => {
        if (student?.paymentHistory && balanceData) {
            // Recalculate totals when payment history changes
            const currentTotalPaid = student.paymentHistory.reduce((sum, payment) => {
                return payment.status === 'completed' ? sum + (parseFloat(payment.amount) || 0) : sum;
            }, 0);

            // Update local state if there's a discrepancy
            if (currentTotalPaid !== balanceData.financialSummary.totalPaid) {
                const updatedFinancialSummary = {
                    ...balanceData.financialSummary,
                    totalPaid: currentTotalPaid,
                    remainingBalance: Math.max(0, balanceData.financialSummary.totalAmountDue - currentTotalPaid),
                    lastUpdated: new Date()
                };
                
                setBalanceData(prev => ({
                    ...prev,
                    financialSummary: updatedFinancialSummary
                }));
            }
        }
    }, [student?.paymentHistory, balanceData]);

    const handleRecalculate = async () => {
        if (!student || !feeStructure) return;
        
        try {
            const calculatedData = await calculateAndStoreFees(student, subjects, feeStructure);
            if (calculatedData) {
                setBalanceData({
                    ...calculatedData.feeBreakdown,
                    financialSummary: calculatedData.financialSummary
                });
            }
            refreshData?.();
        } catch (error) {
            console.error('Error recalculating fees:', error);
        }
    };

    if (!feeStructure && !error) {
        return <div className={styles.loading}>Loading fee structure...</div>;
    }

    if (loading) {
        return <div className={styles.loading}>Calculating fees...</div>;
    }

    if (!balanceData) {
        return (
            <div className={styles.error}>
                <FaExclamationTriangle /> Unable to calculate fees. Please try again later.
            </div>
        );
    }

    const { financialSummary, ...breakdown } = balanceData;

    return (
        <div className={styles.balanceSection}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                    {breakdown.isEnrolled
                        ? `${student.enrollment?.semester} Semester Fees`
                        : 'Registration Information'}
                </h3>
                <div className={styles.headerActions}>
                    {error && (
                        <div className={styles.warning}>
                            <FaExclamationTriangle /> {error}
                        </div>
                    )}
                    <button 
                        className={styles.recalculateBtn}
                        onClick={handleRecalculate}
                        disabled={calculating}
                    >
                        <FaSyncAlt /> {calculating ? 'Calculating...' : 'Recalculate'}
                    </button>
                </div>
            </div>

            <div className={styles.balanceGrid}>
                <div className={styles.balanceItem}>
                    <span className={styles.balanceLabel}>
                        {breakdown.isEnrolled
                            ? (student.department === 'shs' || student.department === 'jhs')
                                ? 'Tuition Fee (Fixed)'
                                : `Tuition Fee (${breakdown.totalUnits} units @ ₱${breakdown.perUnitRate}/unit)`
                            : 'Registration Fee'}
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{breakdown.tuitionFee.toLocaleString()}
                    </span>
                </div>

                {breakdown.isEnrolled && (
                    <>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Miscellaneous Fee:</span>
                            <span className={styles.balanceValue}>
                                ₱{breakdown.miscFee.toLocaleString()}
                            </span>
                        </div>

                        {breakdown.labFee > 0 && (
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>
                                    Laboratory Fee ({breakdown.labUnits} units @ ₱${breakdown.labUnitRate}/unit)
                                </span>
                                <span className={styles.balanceValue}>
                                    ₱{breakdown.labFee.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {breakdown.otherFees.map((fee, index) => (
                            <div key={index} className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>{fee.name}:</span>
                                <span className={styles.balanceValue}>
                                    ₱{fee.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </>
                )}

                {breakdown.discount > 0 && (
                    <div className={styles.balanceItem}>
                        <span className={styles.balanceLabel}>Discount/Scholarship:</span>
                        <span className={styles.balanceValue}>
                            -₱{breakdown.discount.toLocaleString()}
                        </span>
                    </div>
                )}

                <div className={`${styles.balanceItem} ${styles.totalFees}`}>
                    <span className={styles.balanceLabel}>
                        <FaFileInvoiceDollar style={{ marginRight: '8px' }} />
                        Total Fees:
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{financialSummary.totalAmountDue.toLocaleString()}
                    </span>
                </div>

                <div className={`${styles.balanceItem} ${styles.totalPaid}`}>
                    <span className={styles.balanceLabel}>
                        <FaMoneyBillWave />Total Paid:
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{financialSummary.totalPaid.toLocaleString()}
                    </span>
                </div>

                <div className={`${styles.balanceItem} ${styles.totalBalance}`}>
                    <span className={styles.balanceLabel}>
                        <FaWallet style={{ marginRight: '8px' }} />
                        Remaining Balance:
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{financialSummary.remainingBalance.toLocaleString()}
                    </span>
                </div>
            </div>

            {breakdown.isEnrolled && !breakdown.hasSubjects && (
                <div className={styles.note}>
                    <strong>Note:</strong> Final tuition fee will be calculated after all subjects are loaded.
                    Current amount shows the minimum registration fee.
                </div>
            )}

            <div className={styles.paymentActions}>
                <button
                    className={styles.payButton}
                    onClick={onMakePayment}
                    disabled={!breakdown.isEnrolled || financialSummary.remainingBalance <= 0}
                >
                    Make Payment
                </button>
            </div>
        </div>
    );
};

export default BalanceBreakdown;