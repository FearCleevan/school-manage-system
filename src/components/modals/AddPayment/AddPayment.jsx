// src/components/modals/AddPayment/AddPayment.jsx
import React, { useEffect, useState } from 'react';
import styles from './AddPayment.module.css';
import { db } from '../../../lib/firebase/config';
import { doc, runTransaction, collection } from 'firebase/firestore';
import { FaTimes, FaPrint, FaMoneyBillWave, FaExclamationTriangle } from 'react-icons/fa';

const AddPayment = ({ student, paymentToEdit, onClose, onPaymentSuccess, loading: externalLoading, error: externalError }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentType: 'tuition',
    paymentMethod: 'cash',
    description: '',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const isEditing = !!paymentToEdit;

  const paymentTypes = [
    { value: 'tuition', label: 'Tuition Fee' },
    { value: 'misc', label: 'Miscellaneous Fee' },
    { value: 'lab', label: 'Laboratory Fee' },
    { value: 'enrollment', label: 'Enrollment Fee' },
    { value: 'other', label: 'Other' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' }
  ];

  const paymentStatuses = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partial' },
    { value: 'failed', label: 'Failed' }
  ];

  // ✅ PRE-FILL FIELDS IF EDITING
  useEffect(() => {
    if (paymentToEdit) {
      setFormData({
        amount: paymentToEdit.amount || '',
        paymentType: paymentToEdit.paymentType || paymentToEdit.type || 'tuition',
        paymentMethod: paymentToEdit.paymentMethod || 'cash',
        description: paymentToEdit.description || '',
        status: paymentToEdit.status || 'completed',
        date: paymentToEdit.date || new Date().toISOString().split('T')[0],
        dueDate: paymentToEdit.dueDate || ''
      });
    }
  }, [paymentToEdit]);

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

  // ✅ ADD OR EDIT PAYMENT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid payment amount');
      }

      const paymentAmount = parseFloat(formData.amount);

      // Prepare payment data
      const paymentData = {
        id: paymentToEdit ? paymentToEdit.id : `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentAmount,
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        description: formData.paymentType === 'other' 
          ? formData.description 
          : paymentTypes.find(t => t.value === formData.paymentType)?.label || formData.paymentType,
        status: formData.status,
        date: formData.date,
        dueDate: formData.dueDate || null
      };

      // Process the payment using the enhanced transaction system
      const result = await processPaymentUpdate(student.id, paymentData);

      // Prepare receipt data
      const receiptInfo = {
        ...paymentData,
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        financialSnapshot: {
          prePaymentBalance: result.updatedFinancialSummary.remainingBalance + paymentAmount,
          postPaymentBalance: result.updatedFinancialSummary.remainingBalance,
          totalPaidToDate: result.updatedFinancialSummary.totalPaid,
          totalAmountDue: result.updatedFinancialSummary.totalAmountDue
        }
      };

      setReceiptData(receiptInfo);
      setSuccess(true);
      
      // Call success callback
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentData);
      }

    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err.message || "Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const printReceipt = () => {
    if (!receiptData) return;

    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${receiptData.id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              background: #f8f9fa;
            }
            .receipt { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white;
              border: 2px solid #007bff;
              border-radius: 12px;
              padding: 25px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #e9ecef;
              padding-bottom: 15px;
            }
            .header h2 {
              color: #007bff;
              margin: 0 0 5px 0;
            }
            .details { 
              margin-bottom: 20px; 
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 10px;
              padding: 5px 0;
            }
            .detail-row:not(:last-child) {
              border-bottom: 1px solid #f8f9fa;
            }
            .footer { 
              text-align: center; 
              margin-top: 25px; 
              font-size: 12px;
              color: #6c757d;
              border-top: 2px solid #e9ecef;
              padding-top: 15px;
            }
            .divider { 
              border-top: 2px dashed #dee2e6; 
              margin: 20px 0; 
            }
            .financial-summary { 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 8px;
              margin: 15px 0;
              border-left: 4px solid #28a745;
            }
            .amount-highlight {
              font-size: 1.2em;
              font-weight: bold;
              color: #28a745;
            }
            .institution {
              font-weight: bold;
              color: #2c3e50;
              font-size: 1.1em;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="institution">EDUCATIONAL INSTITUTION</div>
              <h2>OFFICIAL PAYMENT RECEIPT</h2>
              <p>${new Date(receiptData.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span><strong>Reference No:</strong></span>
                <span>${receiptData.id}</span>
              </div>
              <div class="detail-row">
                <span><strong>Student ID:</strong></span>
                <span>${receiptData.studentId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Student Name:</strong></span>
                <span>${receiptData.studentName}</span>
              </div>
              
              <div class="divider"></div>
              
              <div class="detail-row">
                <span><strong>Payment Type:</strong></span>
                <span>${receiptData.description}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Method:</strong></span>
                <span>${receiptData.paymentMethod}</span>
              </div>
              <div class="detail-row">
                <span><strong>Status:</strong></span>
                <span style="color: ${
                  receiptData.status === 'completed' ? '#28a745' : 
                  receiptData.status === 'pending' ? '#ffc107' : '#dc3545'
                }">${receiptData.status}</span>
              </div>
              
              <div class="detail-row">
                <span><strong>Amount Paid:</strong></span>
                <span class="amount-highlight">₱${receiptData.amount.toLocaleString()}</span>
              </div>
              
              ${receiptData.financialSnapshot ? `
              <div class="financial-summary">
                <div class="detail-row">
                  <span>Previous Balance:</span>
                  <span>₱${receiptData.financialSnapshot.prePaymentBalance.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span>New Balance:</span>
                  <span>₱${receiptData.financialSnapshot.postPaymentBalance.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span>Total Paid to Date:</span>
                  <span>₱${receiptData.financialSnapshot.totalPaidToDate.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span>Total Amount Due:</span>
                  <span>₱${receiptData.financialSnapshot.totalAmountDue.toLocaleString()}</span>
                </div>
              </div>
              ` : ''}
              
              <div class="divider"></div>
              
              <div class="detail-row">
                <span><strong>Payment Date:</strong></span>
                <span>${new Date(receiptData.date).toLocaleString()}</span>
              </div>
              ${receiptData.dueDate ? `
              <div class="detail-row">
                <span><strong>Due Date:</strong></span>
                <span>${new Date(receiptData.dueDate).toLocaleDateString()}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p><strong>Thank you for your payment!</strong></p>
              <p>This is your official receipt. Please keep it for your records.</p>
              <p>For inquiries, please contact the accounting office.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // window.close(); // Uncomment if you want to auto-close after printing
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  // ✅ SUCCESS VIEW (ADD ONLY)
  if (success && !isEditing) {
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
            <div className={styles.successIcon}>✓</div>
            <h3>Payment Processed Successfully</h3>
            <p>The payment has been recorded and the student's financial information has been updated.</p>

            <div className={styles.receiptPreview}>
              <h4>Receipt Summary</h4>
              <div className={styles.receiptDetails}>
                <div className={styles.receiptRow}>
                  <span>Reference No:</span>
                  <strong>{receiptData.id}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Student:</span>
                  <span>{receiptData.studentName}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Amount:</span>
                  <strong className={styles.amount}>₱{receiptData.amount.toLocaleString()}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Payment Type:</span>
                  <span>{receiptData.description}</span>
                </div>
                {receiptData.financialSnapshot && (
                  <>
                    <div className={styles.receiptRow}>
                      <span>New Balance:</span>
                      <span>₱{receiptData.financialSnapshot.postPaymentBalance.toLocaleString()}</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span>Total Paid:</span>
                      <span>₱{receiptData.financialSnapshot.totalPaidToDate.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.printButton} onClick={printReceipt}>
                <FaPrint /> Print Receipt
              </button>
              <button className={styles.closeSuccessButton} onClick={onClose}>
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
          <h2>{isEditing ? "Edit Payment" : "Add New Payment"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.studentInfo}>
          <h3>{student.firstName} {student.lastName}</h3>
          <p>Student ID: {student.studentId}</p>
          {student.financialSummary && (
            <div className={styles.balanceInfo}>
              <p><strong>Current Balance:</strong> ₱{student.financialSummary.remainingBalance?.toLocaleString() || '0'}</p>
              <p><strong>Total Paid:</strong> ₱{student.financialSummary.totalPaid?.toLocaleString() || '0'}</p>
              <p><strong>Total Due:</strong> ₱{student.financialSummary.totalAmountDue?.toLocaleString() || '0'}</p>
            </div>
          )}
        </div>

        {(error || externalError) && (
          <div className={styles.errorMessage}>
            <FaExclamationTriangle /> {error || externalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.paymentForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount (₱) *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="Enter amount"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="paymentType">Payment Type *</label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                required
              >
                {paymentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="paymentMethod">Payment Method *</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.paymentType === 'other' && (
            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Enter payment description"
              />
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="date">Payment Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dueDate">Due Date (Optional)</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={loading || externalLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={loading || externalLoading}
            >
              {loading || externalLoading ? (
                'Processing...'
              ) : isEditing ? (
                'Update Payment'
              ) : (
                <>
                  <FaMoneyBillWave /> Submit Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;