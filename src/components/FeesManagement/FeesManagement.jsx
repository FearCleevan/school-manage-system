// src/components/payment/FeesManagement/FeesManagement.jsx
import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import styles from './FeesManagement.module.css';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

const FeesManagement = () => {
  const [feeStructure, setFeeStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editedFees, setEditedFees] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  // Default fee structure (fallback)
  const defaultFeeStructure = {
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

  // Load fee structure from Firestore
useEffect(() => {
  const loadFeeStructure = async () => {
    try {
      const feeDoc = await getDoc(doc(db, 'system', 'feeStructure'));
      
      if (feeDoc.exists()) {
        setFeeStructure(feeDoc.data());
      } else {
        await setDoc(doc(db, 'system', 'feeStructure'), defaultFeeStructure);
        setFeeStructure(defaultFeeStructure);
      }
    } catch (error) {
      console.error('Error loading fee structure:', error);
      setMessage({ type: 'error', text: 'Failed to load fee structure' });
      setFeeStructure(defaultFeeStructure);
    } finally {
      setLoading(false);
    }
  };

  loadFeeStructure();
}, []);

  const startEditing = (department) => {
    setEditingDepartment(department);
    setEditedFees({ ...feeStructure[department] });
  };

  const cancelEditing = () => {
    setEditingDepartment(null);
    setEditedFees({});
  };

  const handleFeeChange = (field, value) => {
    setEditedFees(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const saveFees = async (department) => {
    if (!editedFees || Object.keys(editedFees).length === 0) return;

    setSaving(true);
    try {
      const updatedStructure = {
        ...feeStructure,
        [department]: editedFees
      };

      await updateDoc(doc(db, 'system', 'feeStructure'), updatedStructure);
      setFeeStructure(updatedStructure);
      setEditingDepartment(null);
      setEditedFees({});
      setMessage({ type: 'success', text: 'Fee structure updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving fee structure:', error);
      setMessage({ type: 'error', text: 'Failed to update fee structure' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all fees to default values? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'feeStructure'), defaultFeeStructure);
      setFeeStructure(defaultFeeStructure);
      setEditingDepartment(null);
      setMessage({ type: 'success', text: 'All fees reset to default values!' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error resetting fee structure:', error);
      setMessage({ type: 'error', text: 'Failed to reset fee structure' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        Loading fee structure...
      </div>
    );
  }

  return (
    <div className={styles.feesManagementContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FaMoneyBillWave /> Fees Management
        </h2>
        <p className={styles.subtitle}>
          Manage fee structures for different departments
        </p>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.actions}>
        <button 
          className={styles.resetButton}
          onClick={resetToDefaults}
          disabled={saving}
        >
          Reset to Defaults
        </button>
      </div>

      <div className={styles.feeStructureGrid}>
        {Object.entries(feeStructure).map(([deptKey, deptFees]) => (
          <DepartmentFeeCard
            key={deptKey}
            departmentKey={deptKey}
            department={deptFees}
            isEditing={editingDepartment === deptKey}
            editedFees={editedFees}
            onStartEdit={() => startEditing(deptKey)}
            onCancelEdit={cancelEditing}
            onSave={() => saveFees(deptKey)}
            onFeeChange={handleFeeChange}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
};

// Department Fee Card Component
const DepartmentFeeCard = ({
  departmentKey,
  department,
  isEditing,
  editedFees,
  onStartEdit,
  onCancelEdit,
  onSave,
  onFeeChange,
  saving
}) => {
  const isSHS = departmentKey === 'shs';
  const isJHS = departmentKey === 'jhs';
  const hasFixedFee = isSHS || isJHS;

  return (
    <div className={styles.departmentCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.departmentName}>{department.name}</h3>
        <div className={styles.cardActions}>
          {!isEditing ? (
            <button
              className={styles.editButton}
              onClick={onStartEdit}
              disabled={saving}
            >
              <FaEdit /> Edit
            </button>
          ) : (
            <div className={styles.editActions}>
              <button
                className={styles.saveButton}
                onClick={onSave}
                disabled={saving}
              >
                <FaSave /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                className={styles.cancelButton}
                onClick={onCancelEdit}
                disabled={saving}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.feeFields}>
        {hasFixedFee ? (
          <>
            <FeeField
              label="Fixed Tuition Fee"
              name="fixedFee"
              value={isEditing ? editedFees.fixedFee : department.fixedFee}
              editing={isEditing}
              onChange={onFeeChange}
            />
            <FeeField
              label="Per Unit Rate"
              name="perUnit"
              value={isEditing ? editedFees.perUnit : department.perUnit}
              editing={isEditing}
              onChange={onFeeChange}
              disabled={true}
            />
          </>
        ) : (
          <>
            <FeeField
              label="Per Unit Rate"
              name="perUnit"
              value={isEditing ? editedFees.perUnit : department.perUnit}
              editing={isEditing}
              onChange={onFeeChange}
            />
            <FeeField
              label="Lab Fee Per Unit"
              name="labFeePerUnit"
              value={isEditing ? editedFees.labFeePerUnit : department.labFeePerUnit}
              editing={isEditing}
              onChange={onFeeChange}
            />
          </>
        )}

        <FeeField
          label="Miscellaneous Fee"
          name="miscFee"
          value={isEditing ? editedFees.miscFee : department.miscFee}
          editing={isEditing}
          onChange={onFeeChange}
        />
        <FeeField
          label="Library Fee"
          name="libraryFee"
          value={isEditing ? editedFees.libraryFee : department.libraryFee}
          editing={isEditing}
          onChange={onFeeChange}
        />
        <FeeField
          label="Athletic Fee"
          name="athleticFee"
          value={isEditing ? editedFees.athleticFee : department.athleticFee}
          editing={isEditing}
          onChange={onFeeChange}
        />
        <FeeField
          label="Medical Fee"
          name="medicalFee"
          value={isEditing ? editedFees.medicalFee : department.medicalFee}
          editing={isEditing}
          onChange={onFeeChange}
        />
        <FeeField
          label="Registration Fee"
          name="registrationFee"
          value={isEditing ? editedFees.registrationFee : department.registrationFee}
          editing={isEditing}
          onChange={onFeeChange}
        />
      </div>

      {!isEditing && (
        <div className={styles.feeSummary}>
          <div className={styles.summaryItem}>
            <span>Base Tuition:</span>
            <span>₱{hasFixedFee ? department.fixedFee?.toLocaleString() : `$${department.perUnit}/unit`}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Total Fixed Fees:</span>
            <span>₱{(
              (department.miscFee || 0) +
              (department.libraryFee || 0) +
              (department.athleticFee || 0) +
              (department.medicalFee || 0) +
              (department.registrationFee || 0)
            ).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Fee Field Component
const FeeField = ({ label, name, value, editing, onChange, disabled = false }) => {
  if (editing) {
    return (
      <div className={styles.feeField}>
        <label htmlFor={name}>{label}:</label>
        <div className={styles.inputGroup}>
          <span className={styles.currencySymbol}>₱</span>
          <input
            id={name}
            type="number"
            min="0"
            step="0.01"
            value={value || 0}
            onChange={(e) => onChange(name, e.target.value)}
            disabled={disabled}
            className={disabled ? styles.disabledInput : ''}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feeField}>
      <span className={styles.fieldLabel}>{label}:</span>
      <span className={styles.fieldValue}>₱{(value || 0).toLocaleString()}</span>
    </div>
  );
};

export default FeesManagement;