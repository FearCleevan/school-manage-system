import React, { useState } from "react";
import {
  FaPrint,
  FaFileExcel,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaPlus,
} from "react-icons/fa";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import styles from "./PaymentHistory.module.css";
import AddPayment from "../../modals/AddPayment/AddPayment";
import ConfirmationModal from "./ConfirmationModal";

const PaymentHistory = ({ student, refreshData }) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null); // ✅ used when editing
  const [actionMenu, setActionMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null); // stores payment ID
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // ✅ FIXED DELETE PAYMENT FUNCTION
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    setLoading(true);
    setError("");

    try {
      const studentRef = doc(db, "students", student.id);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) throw new Error("Student record not found");

      const studentData = studentDoc.data();
      const currentHistory = studentData.paymentHistory || [];

      const paymentRecord = currentHistory.find((p) => p.id === paymentToDelete);
      if (!paymentRecord) throw new Error("Payment not found");

      const updatedHistory = currentHistory.filter((p) => p.id !== paymentToDelete);

      await updateDoc(studentRef, {
        paymentHistory: updatedHistory,
        balance: (studentData.balance || 0) + (paymentRecord.amount || 0),
      });

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

  const confirmDelete = (paymentId) => {
    setPaymentToDelete(paymentId);
    setShowDeleteModal(true);
  };

  const toggleActionMenu = (paymentId, e) => {
    e.stopPropagation();
    setActionMenu(actionMenu === paymentId ? null : paymentId);
  };

  return (
    <div className={styles.historySection}>
      {/* ✅ Add / Edit Payment Modal */}
      {showAddPayment && (
        <AddPayment
          student={student}
          paymentToEdit={selectedPayment} // ✅ passes the payment object to modal
          onClose={() => {
            setShowAddPayment(false);
            setSelectedPayment(null);
          }}
          onPaymentSuccess={() => {
            refreshData();
            setShowAddPayment(false);
            setSelectedPayment(null);
          }}
        />
      )}

      {/* ✅ Delete Confirmation Modal */}
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
              setSelectedPayment(null); // ✅ ensures it's NOT edit mode
              setShowAddPayment(true);
            }}
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
                    <div className={styles.actionCell}>
                      <button className={styles.actionButton} onClick={(e) => toggleActionMenu(payment.id, e)}>
                        <FaEllipsisV />
                      </button>

                      {actionMenu === payment.id && (
                        <div className={styles.actionMenu}>
                          <button
                            onClick={() => {
                              printReceipt(payment);
                              setActionMenu(null);
                            }}
                          >
                            <FaPrint /> Print Receipt
                          </button>

                          {/* ✅ FIXED — Edit button passes full payment object */}
                          <button
                            onClick={() => {
                              setSelectedPayment(payment); // ✅ Pass object to modal
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
