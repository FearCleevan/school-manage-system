//src/components/modals/AddPayment/AddPayment.jsx
// src/components/modals/AddPayment/AddPayment.jsx
import React, { useState, useEffect } from 'react';
import styles from './AddPayment.module.css';
import { db } from '../../../lib/firebase/config';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { FaTimes, FaPrint } from 'react-icons/fa';

const AddPayment = ({ student, onClose, onPaymentSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('enrollment');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const paymentTypes = [
    { value: 'enrollment', label: 'Enrollment Fee' },
    { value: 'tuition', label: 'Tuition Fee' },
    { value: 'exam', label: 'Exam Fee' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid payment amount');
      }

      const paymentAmount = parseFloat(amount);
      const paymentDate = new Date().toISOString();
      const paymentRef = `PAY-${Date.now()}`;

      const paymentRecord = {
        id: paymentRef,
        date: paymentDate,
        amount: paymentAmount,
        type: paymentType,
        description: paymentType === 'other' ? description : paymentTypes.find(t => t.value === paymentType).label,
        status: 'Completed'
      };

      // Update student document in Firestore
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        paymentHistory: arrayUnion(paymentRecord),
        // Deduct from balance if needed (you might need to adjust this based on your balance calculation logic)
        balance: (student.balance || 0) - paymentAmount
      });

      setReceiptData({
        ...paymentRecord,
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId
      });
      setSuccess(true);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
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
              <p>${new Date().toLocaleDateString()}</p>
            </div>
            <div class="details">
              <div class="detail-row">
                <span>Reference No:</span>
                <span>${receiptData.id}</span>
              </div>
              <div class="detail-row">
                <span>Student ID:</span>
                <span>${receiptData.studentId}</span>
              </div>
              <div class="detail-row">
                <span>Student Name:</span>
                <span>${receiptData.studentName}</span>
              </div>
              <div class="divider"></div>
              <div class="detail-row">
                <span>Payment Type:</span>
                <span>${receiptData.description}</span>
              </div>
              <div class="detail-row">
                <span>Amount Paid:</span>
                <span>₱${receiptData.amount.toLocaleString()}</span>
              </div>
              <div class="divider"></div>
              <div class="detail-row">
                <span>Date:</span>
                <span>${new Date(receiptData.date).toLocaleString()}</span>
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
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  if (success) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <h2>Payment Successful</h2>
            <button className={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className={styles.successContent}>
            <p>The payment has been successfully processed.</p>
            <div className={styles.receiptPreview}>
              <h4>Receipt Summary</h4>
              <p><strong>Reference No:</strong> {receiptData.id}</p>
              <p><strong>Student:</strong> {receiptData.studentName}</p>
              <p><strong>Amount:</strong> ₱{receiptData.amount.toLocaleString()}</p>
              <p><strong>Payment Type:</strong> {receiptData.description}</p>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.printButton} onClick={printReceipt}>
                <FaPrint /> Print Receipt
              </button>
              <button className={styles.closeButton} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Add New Payment</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.paymentForm}>
          <div className={styles.formGroup}>
            <label>Student</label>
            <input
              type="text"
              value={`${student.firstName} ${student.lastName} (${student.studentId})`}
              disabled
            />
          </div>

          <div className={styles.formGroup}>
            <label>Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              required
            >
              {paymentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {paymentType === 'other' && (
            <div className={styles.formGroup}>
              <label>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Enter payment description"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Amount (₱)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
              placeholder="Enter amount"
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Processing...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;