import React, { useState } from "react";
import {
  FaPrint,
  FaFileExcel,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaPlus,
} from "react-icons/fa";
import { doc, collection, runTransaction } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import styles from "./PaymentHistory.module.css";
import AddPayment from "../../modals/AddPayment/AddPayment";
import ConfirmationModal from "./ConfirmationModal";

const PaymentHistory = ({ student, refreshData }) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Enhanced payment processing with proper financial integration
  const processPaymentUpdate = async (studentId, paymentData, isDelete = false) => {
    const studentRef = doc(db, "students", studentId);
    
    try {
      const result = await runTransaction(db, async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        if (!studentDoc.exists()) {
          throw new Error("Student record not found");
        }

        const studentData = studentDoc.data();
        const currentHistory = studentData.paymentHistory || [];
        const financialSummary = studentData.financialSummary || {
          totalTuition: 0,
          totalFees: 0,
          totalDiscount: 0,
          totalAmountDue: 0,
          totalPaid: 0,
          remainingBalance: 0,
          lastUpdated: new Date()
        };

        const feeBreakdown = studentData.feeBreakdown || {
          tuitionFee: 0,
          miscFee: 0,
          labFee: 0,
          otherFees: [],
          discount: 0,
          totalUnits: 0,
          labUnits: 0,
          calculationDate: new Date()
        };

        let updatedHistory;
        let newTotalPaid;
        let remainingBalance;

        if (isDelete) {
          // Delete payment
          const paymentToRemove = currentHistory.find(p => p.id === paymentData.paymentId);
          if (!paymentToRemove) throw new Error("Payment not found");

          updatedHistory = currentHistory.filter(p => p.id !== paymentData.paymentId);
          newTotalPaid = Math.max(0, financialSummary.totalPaid - (paymentToRemove.amount || 0));
        } else {
          // Add or update payment
          const existingPaymentIndex = currentHistory.findIndex(p => p.id === paymentData.id);
          
          if (existingPaymentIndex >= 0) {
            // Update existing payment
            const oldPayment = currentHistory[existingPaymentIndex];
            updatedHistory = [...currentHistory];
            updatedHistory[existingPaymentIndex] = {
              ...paymentData,
              updatedAt: new Date()
            };
            newTotalPaid = Math.max(0, financialSummary.totalPaid - (oldPayment.amount || 0) + (paymentData.amount || 0));
          } else {
            // Add new payment
            const newPayment = {
              ...paymentData,
              id: paymentData.id || `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            updatedHistory = [...currentHistory, newPayment];
            newTotalPaid = financialSummary.totalPaid + (paymentData.amount || 0);
          }
        }

        // Calculate remaining balance based on actual total amount due
        remainingBalance = Math.max(0, financialSummary.totalAmountDue - newTotalPaid);

        // Prepare updated financial summary
        const updatedFinancialSummary = {
          ...financialSummary,
          totalPaid: newTotalPaid,
          remainingBalance: remainingBalance,
          lastUpdated: new Date()
        };

        // Update student document
        transaction.update(studentRef, {
          paymentHistory: updatedHistory,
          financialSummary: updatedFinancialSummary,
          feeBreakdown: {
            ...feeBreakdown,
            lastUpdated: new Date()
          }
        });

        // Record payment in payments collection with financial snapshot
        if (!isDelete && paymentData.id) {
          const paymentRef = doc(collection(db, "payments"), paymentData.id);
          transaction.set(paymentRef, {
            ...paymentData,
            studentId: studentId,
            studentName: `${studentData.firstName} ${studentData.lastName}`,
            studentStudentId: studentData.studentId,
            financialSnapshot: {
              prePaymentBalance: financialSummary.remainingBalance,
              postPaymentBalance: remainingBalance,
              totalPaidToDate: newTotalPaid,
              totalAmountDue: financialSummary.totalAmountDue,
              tuitionFee: feeBreakdown.tuitionFee,
              miscFee: feeBreakdown.miscFee,
              labFee: feeBreakdown.labFee,
              discount: feeBreakdown.discount
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        return {
          updatedHistory,
          updatedFinancialSummary,
          remainingBalance
        };
      });

      return result;
    } catch (error) {
      console.error("Error in payment transaction:", error);
      throw error;
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    setLoading(true);
    setError("");

    try {
      await processPaymentUpdate(student.id, { paymentId: paymentToDelete }, true);
      
      setShowDeleteModal(false);
      setPaymentToDelete(null);
      refreshData();
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError(err.message || "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditPayment = async (paymentData) => {
    setLoading(true);
    setError("");

    try {
      await processPaymentUpdate(student.id, paymentData, false);
      setShowAddPayment(false);
      setSelectedPayment(null);
      refreshData();
    } catch (err) {
      console.error("Error processing payment:", err);
      setError(err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (payment) => {
    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
            .financial-summary { background: #f9f9f9; padding: 10px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>Payment Receipt</h2>
              <p>${new Date(payment.date).toLocaleDateString()}</p>
            </div>
            <div class="details">
              <div class="detail-row">
                <span>Reference No:</span>
                <span>${payment.id}</span>
              </div>
              <div class="detail-row">
                <span>Student ID:</span>
                <span>${student.studentId}</span>
              </div>
              <div class="detail-row">
                <span>Student Name:</span>
                <span>${student.firstName} ${student.lastName}</span>
              </div>
              <div class="divider"></div>
              <div class="detail-row">
                <span>Payment Type:</span>
                <span>${payment.description || payment.type}</span>
              </div>
              <div class="detail-row">
                <span>Amount Paid:</span>
                <span>₱${(payment.amount || 0).toLocaleString()}</span>
              </div>
              <div class="divider"></div>
              ${payment.financialSnapshot ? `
              <div class="financial-summary">
                <div class="detail-row">
                  <span>Previous Balance:</span>
                  <span>₱${payment.financialSnapshot.prePaymentBalance.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span>New Balance:</span>
                  <span>₱${payment.financialSnapshot.postPaymentBalance.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span>Total Paid to Date:</span>
                  <span>₱${payment.financialSnapshot.totalPaidToDate.toLocaleString()}</span>
                </div>
              </div>
              ` : ''}
              <div class="detail-row">
                <span>Date:</span>
                <span>${new Date(payment.date).toLocaleString()}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is your official receipt.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  const confirmDelete = (paymentId) => {
    setPaymentToDelete(paymentId);
    setShowDeleteModal(true);
  };

  const toggleActionMenu = (paymentId, e) => {
    e.stopPropagation();
    if (actionMenu?.id === paymentId) {
      setActionMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenu({
      id: paymentId,
      x: rect.left - 120,
      y: rect.bottom + 5,
    });
  };

  React.useEffect(() => {
    const handleClickOutside = () => {
      if (actionMenu) setActionMenu(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [actionMenu]);

  return (
    <div className={styles.historySection}>
      {showAddPayment && (
        <AddPayment
          student={student}
          paymentToEdit={selectedPayment}
          onClose={() => {
            setShowAddPayment(false);
            setSelectedPayment(null);
            setError("");
          }}
          onPaymentSuccess={handleAddOrEditPayment}
          loading={loading}
          error={error}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Payment"
          message="Are you sure you want to delete this payment record? This action cannot be undone."
          onConfirm={handleDeletePayment}
          onCancel={() => {
            setShowDeleteModal(false);
            setPaymentToDelete(null);
            setError("");
          }}
          loading={loading}
          error={error}
        />
      )}

      <div className={styles.historyHeader}>
        <h3 className={styles.sectionTitle}>Payment History</h3>
        <div className={styles.exportButtons}>
          <button
            className={styles.exportButton}
            onClick={() => {
              setSelectedPayment(null);
              setShowAddPayment(true);
            }}
            disabled={loading}
          >
            <FaPlus /> Add Payment
          </button>
          <button className={styles.exportButton}>
            <FaFileExcel /> Export
          </button>
        </div>
      </div>

      {student.paymentHistory?.length > 0 ? (
        <div className={styles.historyTableContainer}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Ref No.</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Balance After</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {student.paymentHistory.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td>₱{payment.amount.toLocaleString()}</td>
                  <td>{payment.description || payment.type}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${payment.status?.toLowerCase() || "pending"}`}>
                      {payment.status || "Pending"}
                    </span>
                  </td>
                  <td>
                    ₱{payment.financialSnapshot?.postPaymentBalance?.toLocaleString() || 'N/A'}
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button 
                        className={styles.actionButton} 
                        onClick={(e) => toggleActionMenu(payment.id, e)}
                        disabled={loading}
                      >
                        <FaEllipsisV />
                      </button>
                      {actionMenu?.id === payment.id && (
                        <div
                          className={styles.actionMenu}
                          style={{ top: actionMenu.y, left: actionMenu.x }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              printReceipt(payment);
                              setActionMenu(null);
                            }}
                          >
                            <FaPrint /> Print Receipt
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowAddPayment(true);
                              setActionMenu(null);
                            }}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => {
                              confirmDelete(payment.id);
                              setActionMenu(null);
                            }}
                            className={styles.deleteAction}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.noPayments}>
          No payment history available.
          <button className={styles.addFirstPayment} onClick={() => setShowAddPayment(true)}>
            Add First Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;