import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import styles from './EditSubject.module.css';

const EditSubject = ({ show, onClose, subject, onUpdateSubject }) => {
    const [formData, setFormData] = useState({
        subjectId: '',
        subjectName: '',
        course: 'BSIT',
        yearLevel: '1st Year',
        semester: '1st Semester',
        status: 'Active',
        terms: {
            firstTerm: [],
            secondTerm: []
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const courses = [
        'BSIT', 'BSHM', 'BSBA', 'BSTM',
        'BTVTeD-AT', 'BTVTeD-HVACR TECH', 'BTVTeD-FSM', 'BTVTeD-ET',
        'SHS', 'JHS'
    ];

    const yearLevels = [
        '1st Year', '2nd Year', '3rd Year', '4th Year',
        'Grade 11', 'Grade 12'
    ];

    const semesters = [
        { value: '1st Semester', label: '1st Semester' },
        { value: '2nd Semester', label: '2nd Semester' },
        { value: 'Summer', label: 'Summer' }
    ];

    const statuses = ['Active', 'Inactive'];

    // Initialize form with subject data
    useEffect(() => {
        if (subject) {
            setFormData({
                subjectId: subject.subjectId || '',
                subjectName: subject.subjectName || '',
                course: subject.course || 'BSIT',
                yearLevel: subject.yearLevel || '1st Year',
                semester: subject.semester || '1st Semester',
                status: subject.status || 'Active',
                terms: subject.terms || {
                    firstTerm: [],
                    secondTerm: []
                }
            });
        }
    }, [subject]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTermInputChange = (term, index, field, value) => {
        setFormData(prev => {
            const updatedTerms = { ...prev.terms };
            updatedTerms[term][index] = {
                ...updatedTerms[term][index],
                [field]: value
            };
            return {
                ...prev,
                terms: updatedTerms
            };
        });
    };

    const addTermRow = (term) => {
        setFormData(prev => {
            const updatedTerms = { ...prev.terms };
            updatedTerms[term] = [
                ...updatedTerms[term],
                {
                    subjectCode: '',
                    description: '',
                    lec: 0,
                    lab: 0,
                    units: 0,
                    preReq: ''
                }
            ];
            return {
                ...prev,
                terms: updatedTerms
            };
        });
    };

    const removeTermRow = (term, index) => {
        setFormData(prev => {
            const updatedTerms = { ...prev.terms };
            updatedTerms[term] = updatedTerms[term].filter((_, i) => i !== index);
            return {
                ...prev,
                terms: updatedTerms
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Update in Firestore
            const subjectRef = doc(db, 'subjects', subject.id);
            await updateDoc(subjectRef, {
                ...formData,
                updatedAt: serverTimestamp()
            });

            // Call the parent callback with the updated subject data
            onUpdateSubject({
                id: subject.id,
                ...formData
            });

            // Close the modal
            onClose();
        } catch (err) {
            console.error('Error updating subject:', err);
            setError('Failed to update subject. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!show || !subject) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Edit Subject</h3>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.subjectForm}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="course">Course</label>
                            <select
                                id="course"
                                name="course"
                                value={formData.course}
                                onChange={handleInputChange}
                                className={styles.formSelect}
                            >
                                {courses.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="yearLevel">Year Level</label>
                            <select
                                id="yearLevel"
                                name="yearLevel"
                                value={formData.yearLevel}
                                onChange={handleInputChange}
                                className={styles.formSelect}
                            >
                                {yearLevels.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="semester">Semester</label>
                            <select
                                id="semester"
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                className={styles.formSelect}
                            >
                                {semesters.map(sem => (
                                    <option key={sem.value} value={sem.value}>{sem.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="subjectId">Subject ID</label>
                            <input
                                type="text"
                                id="subjectId"
                                name="subjectId"
                                value={formData.subjectId}
                                onChange={handleInputChange}
                                required
                                className={styles.formInput}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="subjectName">Subject Name</label>
                            <input
                                type="text"
                                id="subjectName"
                                name="subjectName"
                                value={formData.subjectName}
                                onChange={handleInputChange}
                                required
                                className={styles.formInput}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className={styles.formSelect}
                            >
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Subject Loading Details</label>

                        <div className={styles.termSection}>
                            <h4>1st Term:</h4>
                            <table className={styles.termTable}>
                                <thead>
                                    <tr>
                                        <th>Subject Code</th>
                                        <th>Description</th>
                                        <th>Lec</th>
                                        <th>Lab</th>
                                        <th>Units</th>
                                        <th>Pre Req</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.terms.firstTerm.map((row, index) => (
                                        <tr key={`firstTerm-${index}`}>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={row.subjectCode}
                                                    onChange={(e) => handleTermInputChange('firstTerm', index, 'subjectCode', e.target.value)}
                                                    className={styles.tableInput}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={row.description}
                                                    onChange={(e) => handleTermInputChange('firstTerm', index, 'description', e.target.value)}
                                                    className={styles.tableInput}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={row.lec}
                                                    onChange={(e) => handleTermInputChange('firstTerm', index, 'lec', parseInt(e.target.value) || 0)}
                                                    className={styles.tableInput}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={row.lab}
                                                    onChange={(e) => handleTermInputChange('firstTerm', index, 'lab', parseInt(e.target.value) || 0)}
                                                    className={styles.tableInput}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={row.units}
                                                    onChange={(e) => handleTermInputChange('firstTerm', index, 'units', parseInt(e.target.value) || 0)}
                                                    className={styles.tableInput}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={row.preReq}
                                                    onChange={(e) => handleTermInputChange('firstTerm', index, 'preReq', e.target.value)}
                                                    className={styles.tableInput}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTermRow('firstTerm', index)}
                                                    className={styles.removeBtn}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button
                                type="button"
                                onClick={() => addTermRow('firstTerm')}
                                className={styles.addRowBtn}
                            >
                                Add Row
                            </button>
                        </div>

                        {formData.semester !== 'Summer' && (
                            <div className={styles.termSection}>
                                <h4>2nd Term:</h4>
                                <table className={styles.termTable}>
                                    <thead>
                                        <tr>
                                            <th>Subject Code</th>
                                            <th>Description</th>
                                            <th>Lec</th>
                                            <th>Lab</th>
                                            <th>Units</th>
                                            <th>Pre Req</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.terms.secondTerm.map((row, index) => (
                                            <tr key={`secondTerm-${index}`}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={row.subjectCode}
                                                        onChange={(e) => handleTermInputChange('secondTerm', index, 'subjectCode', e.target.value)}
                                                        className={styles.tableInput}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={row.description}
                                                        onChange={(e) => handleTermInputChange('secondTerm', index, 'description', e.target.value)}
                                                        className={styles.tableInput}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={row.lec}
                                                        onChange={(e) => handleTermInputChange('secondTerm', index, 'lec', parseInt(e.target.value) || 0)}
                                                        className={styles.tableInput}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={row.lab}
                                                        onChange={(e) => handleTermInputChange('secondTerm', index, 'lab', parseInt(e.target.value) || 0)}
                                                        className={styles.tableInput}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={row.units}
                                                        onChange={(e) => handleTermInputChange('secondTerm', index, 'units', parseInt(e.target.value) || 0)}
                                                        className={styles.tableInput}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={row.preReq}
                                                        onChange={(e) => handleTermInputChange('secondTerm', index, 'preReq', e.target.value)}
                                                        className={styles.tableInput}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTermRow('secondTerm', index)}
                                                        className={styles.removeBtn}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    onClick={() => addTermRow('secondTerm')}
                                    className={styles.addRowBtn}
                                >
                                    Add Row
                                </button>
                            </div>
                        )}
                    </div>

                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSubject;