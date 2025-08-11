import React from 'react';
import { FaPrint, FaFileExcel } from 'react-icons/fa';
import styles from './PaymentHistory.module.css';

const PaymentHistory = ({ student }) => {
  return (
    <div className={styles.historySection}>
      <div className={styles.historyHeader}>
        <h3 className={styles.sectionTitle}>Payment History</h3>
        <div className={styles.exportButtons}>
          <button className={styles.exportButton}>
            <FaFileExcel /> Export to Excel
          </button>
          <button className={styles.exportButton}>
            <FaPrint /> Print History
          </button>
        </div>
      </div>

      {student.paymentHistory?.length > 0 ? (
        <div className={styles.historyTableContainer}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Reference No.</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Type</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {student.paymentHistory.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{payment.date || 'N/A'}</td>
                  <td>₱{payment.amount?.toLocaleString() || '0'}</td>
                  <td>{payment.type || 'N/A'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${payment.status?.toLowerCase() || 'pending'}`}>
                      {payment.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.printButton}
                      disabled={payment.status !== 'Completed'}
                    >
                      <FaPrint /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.noPayments}>
          No payment history found for this student
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;