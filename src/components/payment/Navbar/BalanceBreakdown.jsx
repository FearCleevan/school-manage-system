import React, { useCallback, useEffect, useState } from 'react';
import styles from './BalanceBreakdown.module.css';
import { FaFileInvoiceDollar, FaMoneyBillWave, FaWallet } from 'react-icons/fa';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

const BalanceBreakdown = ({ student, subjects, onMakePayment }) => {
    const [balanceData, setBalanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalPaid, setTotalPaid] = useState(0);
    const [feeStructure, setFeeStructure] = useState(null);

    // Calculate total paid amount from payment history
    const calculateTotalPaid = useCallback((paymentHistory) => {
        if (!paymentHistory || paymentHistory.length === 0) return 0;
        return paymentHistory.reduce((sum, payment) => {
            return sum + (parseFloat(payment.amount) || 0);
        }, 0);
    }, []);

    // Load fee structure from Firestore
    useEffect(() => {
        const loadFeeStructure = async () => {
            try {
                const feeDoc = await getDoc(doc(db, 'system', 'feeStructure'));
                if (feeDoc.exists()) {
                    setFeeStructure(feeDoc.data());
                }
            } catch (error) {
                console.error('Error loading fee structure:', error);
            }
        };

        loadFeeStructure();
    }, []);

    useEffect(() => {
        if (!student || !subjects || !feeStructure) return;

        const calculateBalance = () => {
            const department = student.department || 'college';
            const fees = feeStructure[department] || feeStructure.college;

            let totalUnits = 0;
            let labUnits = 0;
            let tuitionFee = 0;

            const isEnrolled = student.enrollment?.course !== 'Not enrolled';
            const hasSubjects = subjects.length > 0;

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

            setBalanceData({
                departmentName: fees.name,
                tuitionFee: tuitionFee || 0,
                miscFee: isEnrolled ? (fees.miscFee || 0) : 0,
                labFee: labFee || 0,
                otherFees: [
                    { name: 'Library Fee', amount: fees.libraryFee || 0 },
                    { name: 'Medical Fee', amount: fees.medicalFee || 0 },
                    { name: 'Athletic Fee', amount: fees.athleticFee || 0 }
                ],
                discount: student.discount || 0,
                totalUnits,
                labUnits,
                isEnrolled,
                hasSubjects,
                perUnitRate: fees.perUnit || 0,
                labUnitRate: fees.labFeePerUnit || 0
            });

            // Calculate total paid amount from current student data
            setTotalPaid(calculateTotalPaid(student.paymentHistory));
            setLoading(false);
        };

        calculateBalance();
    }, [student, subjects, feeStructure, calculateTotalPaid]);

    
    if (!feeStructure) {
        return <div className={styles.loading}>Loading fee structure...</div>;
    }

    const calculateTotalUnits = () => {
        let totalUnits = 0;
        let labUnits = 0;

        subjects.forEach(subject => {
            if (subject.units) {
                totalUnits += parseFloat(subject.units) || 0;
                labUnits += parseFloat(subject.lab) || 0;
            } else if (subject.terms) {
                if (subject.terms.firstTerm) {
                    subject.terms.firstTerm.forEach(course => {
                        totalUnits += parseFloat(course.units) || 0;
                        labUnits += parseFloat(course.lab) || 0;
                    });
                }
                if (subject.terms.secondTerm) {
                    subject.terms.secondTerm.forEach(course => {
                        totalUnits += parseFloat(course.units) || 0;
                        labUnits += parseFloat(course.lab) || 0;
                    });
                }
            } else if (Array.isArray(subject)) {
                subject.forEach(course => {
                    totalUnits += parseFloat(course.units) || 0;
                    labUnits += parseFloat(course.lab) || 0;
                });
            }
        });

        return { totalUnits, labUnits };
    };

    if (!balanceData) {
        return (
            <div className={styles.error}>
                Unable to calculate fees. Please try again later.
            </div>
        );
    }

    const { totalUnits, labUnits } = calculateTotalUnits();

    // Merge recalculated values with balanceData
    const mergedBalanceData = {
        ...balanceData,
        totalUnits,
        labUnits,
        tuitionFee: balanceData.isEnrolled && balanceData.hasSubjects
            ? (student.department === 'shs' || student.department === 'jhs')
                ? (balanceData.tuitionFee || 0) // FIXED: Ensure it's a number
                : (totalUnits * balanceData.perUnitRate) || 0
            : (balanceData.tuitionFee || 0), // FIXED: Ensure it's a number
        labFee: (labUnits * balanceData.labUnitRate) || 0 // FIXED: Ensure it's a number
    };

    // FIXED: Ensure all values are numbers and handle NaN cases
    const totalFees = Math.max(0,
        (mergedBalanceData.tuitionFee || 0) +
        (mergedBalanceData.isEnrolled ? (mergedBalanceData.miscFee || 0) : 0) +
        (mergedBalanceData.isEnrolled ? (mergedBalanceData.labFee || 0) : 0) +
        (mergedBalanceData.isEnrolled
            ? mergedBalanceData.otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
            : 0
        ) -
        (mergedBalanceData.discount || 0)
    );

    const remainingBalance = Math.max(0, totalFees - totalPaid);

    if (loading) {
        return <div className={styles.loading}>Calculating fees...</div>;
    }

    return (
        <div className={styles.balanceSection}>
            <h3 className={styles.sectionTitle}>
                {mergedBalanceData.isEnrolled
                    ? `${student.enrollment?.semester} Semester Fees`
                    : 'Registration Information'}
            </h3>

            <div className={styles.balanceGrid}>
                <div className={styles.balanceItem}>
                    <span className={styles.balanceLabel}>
                        {mergedBalanceData.isEnrolled
                            ? (student.department === 'shs' || student.department === 'jhs')
                                ? 'Tuition Fee (Fixed)'
                                : `Tuition Fee (${mergedBalanceData.totalUnits} units @ ₱${mergedBalanceData.perUnitRate}/unit)`
                            : 'Registration Fee'}
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{mergedBalanceData.tuitionFee.toLocaleString()}
                    </span>
                </div>

                {mergedBalanceData.isEnrolled && (
                    <>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Miscellaneous Fee:</span>
                            <span className={styles.balanceValue}>
                                ₱{mergedBalanceData.miscFee.toLocaleString()}
                            </span>
                        </div>

                        {mergedBalanceData.labFee > 0 && (
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>
                                    Laboratory Fee ({mergedBalanceData.labUnits} units @ ₱{mergedBalanceData.labUnitRate}/unit)
                                </span>
                                <span className={styles.balanceValue}>
                                    ₱{mergedBalanceData.labFee.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {mergedBalanceData.otherFees.map((fee, index) => (
                            <div key={index} className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>{fee.name}:</span>
                                <span className={styles.balanceValue}>
                                    ₱{fee.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </>
                )}

                {mergedBalanceData.discount > 0 && (
                    <div className={styles.balanceItem}>
                        <span className={styles.balanceLabel}>Discount/Scholarship:</span>
                        <span className={styles.balanceValue}>
                            -₱{mergedBalanceData.discount.toLocaleString()}
                        </span>
                    </div>
                )}

                <div className={`${styles.balanceItem} ${styles.totalFees}`}>
                    <span className={styles.balanceLabel}>
                        <FaFileInvoiceDollar style={{ marginRight: '8px' }} />
                        Total Fees:
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{totalFees.toLocaleString()}
                    </span>
                </div>

                <div className={`${styles.balanceItem} ${styles.totalPaid}`}>
                    <span className={styles.balanceLabel}>
                        <FaMoneyBillWave />Total Paid:
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{totalPaid.toLocaleString()}
                    </span>
                </div>

                <div className={`${styles.balanceItem} ${styles.totalBalance}`}>
                    <span className={styles.balanceLabel}>
                        <FaWallet style={{ marginRight: '8px' }} />
                        Remaining Balance:
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{remainingBalance.toLocaleString()}
                    </span>
                </div>
            </div>

            {mergedBalanceData.isEnrolled && !mergedBalanceData.hasSubjects && (
                <div className={styles.note}>
                    <strong>Note:</strong> Final tuition fee will be calculated after all subjects are loaded.
                    Current amount shows the minimum registration fee.
                </div>
            )}

            <div className={styles.paymentActions}>
                <button
                    className={styles.payButton}
                    onClick={onMakePayment}
                    disabled={!balanceData.isEnrolled || remainingBalance <= 0}
                >
                    Make Payment
                </button>
            </div>
        </div>
    );
};

export default BalanceBreakdown;