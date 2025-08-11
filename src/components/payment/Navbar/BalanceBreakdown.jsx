import React, { useEffect, useState } from 'react';
import styles from './BalanceBreakdown.module.css';

const BalanceBreakdown = ({ student, subjects }) => {
    const [balanceData, setBalanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student || !subjects) return;

        const calculateBalance = () => {
            const department = student.department || 'college';
            const feeStructure = {
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
            };

            const fees = feeStructure[department] || feeStructure.college;
            let totalUnits = 0;
            let labUnits = 0;
            let tuitionFee = 0;

            const isEnrolled = student.enrollment?.course !== 'Not enrolled';
            const hasSubjects = subjects.length > 0;

            if (isEnrolled && hasSubjects) {
                // Calculate total units and lab units from all subjects
                subjects.forEach(subject => {
                    // For standard subjects
                    if (subject.units) {
                        const units = parseFloat(subject.units) || 0;
                        totalUnits += units;
                        
                        const lab = parseFloat(subject.lab) || 0;
                        labUnits += lab;
                    }
                    // For customized subjects with terms
                    else if (subject.terms) {
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
                    tuitionFee = fees.fixedFee;
                } else {
                    tuitionFee = totalUnits * fees.perUnit;
                }
            } else if (isEnrolled) {
                tuitionFee = fees.registrationFee;
            }

            const labFee = labUnits * (fees.labFeePerUnit || 0);

            setBalanceData({
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
                labUnitRate: fees.labFeePerUnit
            });
            setLoading(false);
        };

        calculateBalance();
    }, [student, subjects]);

    if (loading) {
        return <div className={styles.loading}>Calculating fees...</div>;
    }

    if (!balanceData) {
        return (
            <div className={styles.error}>
                Unable to calculate fees. Please try again later.
            </div>
        );
    }

    const totalBalance = 
        balanceData.tuitionFee +
        (balanceData.isEnrolled ? balanceData.miscFee : 0) +
        (balanceData.isEnrolled ? balanceData.labFee : 0) +
        (balanceData.isEnrolled 
            ? balanceData.otherFees.reduce((sum, fee) => sum + fee.amount, 0) 
            : 0
        ) - 
        balanceData.discount;

    return (
        <div className={styles.balanceSection}>
            <h3 className={styles.sectionTitle}>
                {balanceData.isEnrolled
                    ? `${student.enrollment?.semester} Semester Fees`
                    : 'Registration Information'}
            </h3>

            <div className={styles.balanceGrid}>
                <div className={styles.balanceItem}>
                    <span className={styles.balanceLabel}>
                        {balanceData.isEnrolled
                            ? `Tuition Fee (${balanceData.totalUnits} units @ ₱${balanceData.perUnitRate}/unit)`
                            : 'Registration Fee'}
                    </span>
                    <span className={styles.balanceValue}>
                        ₱{balanceData.tuitionFee.toLocaleString()}
                    </span>
                </div>

                {balanceData.isEnrolled && (
                    <>
                        <div className={styles.balanceItem}>
                            <span className={styles.balanceLabel}>Miscellaneous Fee:</span>
                            <span className={styles.balanceValue}>
                                ₱{balanceData.miscFee.toLocaleString()}
                            </span>
                        </div>

                        {balanceData.labFee > 0 && (
                            <div className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>
                                    Laboratory Fee ({balanceData.labUnits} units @ ₱{balanceData.labUnitRate}/unit)
                                </span>
                                <span className={styles.balanceValue}>
                                    ₱{balanceData.labFee.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {balanceData.otherFees.map((fee, index) => (
                            <div key={index} className={styles.balanceItem}>
                                <span className={styles.balanceLabel}>{fee.name}:</span>
                                <span className={styles.balanceValue}>
                                    ₱{fee.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </>
                )}

                {balanceData.discount > 0 && (
                    <div className={styles.balanceItem}>
                        <span className={styles.balanceLabel}>Discount/Scholarship:</span>
                        <span className={styles.balanceValue}>
                            -₱{balanceData.discount.toLocaleString()}
                        </span>
                    </div>
                )}

                <div className={`${styles.balanceItem} ${styles.totalBalance}`}>
                    <span className={styles.balanceLabel}>Total Current Balance:</span>
                    <span className={styles.balanceValue}>
                        ₱{totalBalance.toLocaleString()}
                    </span>
                </div>
            </div>

            {balanceData.isEnrolled && !balanceData.hasSubjects && (
                <div className={styles.note}>
                    <strong>Note:</strong> Final tuition fee will be calculated after all subjects are loaded.
                    Current amount shows the minimum registration fee.
                </div>
            )}

            <div className={styles.paymentActions}>
                <button
                    className={styles.payButton}
                    disabled={!balanceData.isEnrolled}
                >
                    Make Payment
                </button>
                <button className={styles.printButton}>
                    Print Statement
                </button>
            </div>
        </div>
    );
};

export default BalanceBreakdown;