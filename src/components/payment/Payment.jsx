// src/components/payment/Payment.jsx
import React, { useState } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import styles from './Payment.module.css';
import AllStudents from './AllStudents';

const Payment = () => {
  const [activeTab, setActiveTab] = useState("allStudents");

  return (
    <div className={styles.paymentManagementContainer}>
      <div className={styles.paymentManagement}>
        <h2 className={styles.managementHeader}>
          <FaMoneyBillWave /> Payment Management
        </h2>

        {/* Payment Tabs */}
        <div className={styles.paymentTabs}>
          <button
            className={`${styles.paymentTab} ${activeTab === "allStudents" ? styles.active : ""}`}
            onClick={() => setActiveTab("allStudents")}
          >
            All Students
          </button>
          <button
            className={`${styles.paymentTab} ${activeTab === "feesManagement" ? styles.active : ""}`}
            onClick={() => setActiveTab("feesManagement")}
          >
            Fees Management
          </button>
          <button
            className={`${styles.paymentTab} ${activeTab === "paymentHistory" ? styles.active : ""}`}
            onClick={() => setActiveTab("paymentHistory")}
          >
            Payment History
          </button>
          <button
            className={`${styles.paymentTab} ${activeTab === "paymentAnalytics" ? styles.active : ""}`}
            onClick={() => setActiveTab("paymentAnalytics")}
          >
            Payment Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === "allStudents" && <AllStudents />}
          {activeTab === "feesManagement" && <div>Fees Management Content Coming Soon</div>}
          {activeTab === "paymentHistory" && <div>Payment History Content Coming Soon</div>}
          {activeTab === "paymentAnalytics" && <div>Payment Analytics Content Coming Soon</div>}
        </div>
      </div>
    </div>
  );
};

export default Payment;