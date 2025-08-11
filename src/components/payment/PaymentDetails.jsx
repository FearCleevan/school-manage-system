import React, { useState } from 'react';
import { FaTimes, FaPrint, FaFileExcel, FaRedo, FaEye } from 'react-icons/fa';
import styles from './PaymentDetails.module.css';

const PaymentDetails = ({ student, onClose }) => {
    const [activeTab, setActiveTab] = useState('balance');
    
    // Mock data for total balance calculation
    const balanceData = {
        tuitionFee: 15000,
        miscFee: 2500,
        labFee: 3000,
        otherFees: [
            { name: 'Library Fee', amount: 500 },
            { name: 'Medical Fee', amount: 300 },
            { name: 'Athletic Fee', amount: 200 }
        ],
        discount: 1000,
        totalUnits: 24
    };

    // Calculate total other fees
    const totalOtherFees = balanceData.otherFees.reduce((sum, fee) => sum + fee.amount, 0);
    
    // Calculate total balance
    const totalBalance = balanceData.tuitionFee + 
                         balanceData.miscFee + 
                         balanceData.labFee + 
                         totalOtherFees - 
                         balanceData.discount;

    // Mock data for payment history
    const paymentHistory = [
        {
            id: 'PAY-2023-001',
            date: '2023-01-15',
            amount: 5000,
            type: 'Tuition',
            status: 'Completed'
        },
        {
            id: 'PAY-2023-002',
            date: '2023-02-20',
            amount: 3000,
            type: 'Enrollment',
            status: 'Completed'
        },
        {
            id: 'PAY-2023-003',
            date: '2023-03-10',
            amount: 1500,
            type: 'Exam',
            status: 'Pending'
        },
        {
            id: 'PAY-2023-004',
            date: '2023-04-05',
            amount: 800,
            type: 'Others',
            status: 'Completed'
        },
        {
            id: 'PAY-2023-005',
            date: '2023-05-12',
            amount: 1200,
            type: 'Lab',
            status: 'Completed'
        },
        {
            id: 'PAY-2023-006',
            date: '2023-06-18',
            amount: 2000,
            type: 'Tuition',
            status: 'Completed'
        }
    ];

    const formatFullName = (student) => {
        return `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}`;
    };

    if (!student) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h2>Payment Details</h2>
                    <div className={styles.headerButtons}>
                        <button className={styles.closeButton} onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className={styles.modalContent}>
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

                    <div className={styles.paymentContent}>
                        <div className={styles.paymentTabs}>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'balance' ? styles.active : ''}`}
                                onClick={() => setActiveTab('balance')}
                            >
                                Total Balance
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                Payment History
                            </button>
                        </div>

                        {activeTab === 'balance' ? (
                            <div className={styles.balanceSection}>
                                <h3 className={styles.sectionTitle}>Balance Breakdown</h3>
                                
                                <div className={styles.balanceGrid}>
                                    <div className={styles.balanceItem}>
                                        <span className={styles.balanceLabel}>Tuition Fee:</span>
                                        <span className={styles.balanceValue}>₱{balanceData.tuitionFee.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className={styles.balanceItem}>
                                        <span className={styles.balanceLabel}>Miscellaneous Fee:</span>
                                        <span className={styles.balanceValue}>₱{balanceData.miscFee.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className={styles.balanceItem}>
                                        <span className={styles.balanceLabel}>Laboratory Fee:</span>
                                        <span className={styles.balanceValue}>₱{balanceData.labFee.toLocaleString()}</span>
                                    </div>
                                    
                                    {balanceData.otherFees.map((fee, index) => (
                                        <div key={index} className={styles.balanceItem}>
                                            <span className={styles.balanceLabel}>{fee.name}:</span>
                                            <span className={styles.balanceValue}>₱{fee.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    
                                    <div className={styles.balanceItem}>
                                        <span className={styles.balanceLabel}>Total Units:</span>
                                        <span className={styles.balanceValue}>{balanceData.totalUnits}</span>
                                    </div>
                                    
                                    <div className={styles.balanceItem}>
                                        <span className={styles.balanceLabel}>Discount:</span>
                                        <span className={styles.balanceValue}>-₱{balanceData.discount.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className={`${styles.balanceItem} ${styles.totalBalance}`}>
                                        <span className={styles.balanceLabel}>Total Balance:</span>
                                        <span className={styles.balanceValue}>₱{totalBalance.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div className={styles.paymentActions}>
                                    <button className={styles.payButton}>Make Payment</button>
                                    <button className={styles.printButton}>
                                        <FaPrint /> Print Statement
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.historySection}>
                                <div className={styles.historyHeader}>
                                    <h3 className={styles.sectionTitle}>Payment History</h3>
                                    <div className={styles.exportButtons}>
                                        <button className={styles.exportButton}>
                                            <FaFileExcel /> Export
                                        </button>
                                        <button className={styles.exportButton}>
                                            <FaPrint /> Print
                                        </button>
                                    </div>
                                </div>
                                
                                <div className={styles.historyTableContainer}>
                                    <table className={styles.historyTable}>
                                        <thead>
                                            <tr>
                                                <th>Payment Ref. No</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentHistory.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td>{payment.id}</td>
                                                    <td>{payment.date}</td>
                                                    <td>₱{payment.amount.toLocaleString()}</td>
                                                    <td>{payment.type}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${payment.status.toLowerCase()}`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className={styles.printButton}>
                                                            <FaPrint /> Print
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetails;