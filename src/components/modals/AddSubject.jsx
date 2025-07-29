//src/components/modals/AddSubject.jsx
import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import styles from './AddSubject.module.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddSubject = ({ show, onClose, onAddSubject }) => {
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
    const [autoGenerate, setAutoGenerate] = useState(true);

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

    // Function to generate subject ID and name
    const generateSubjectInfo = (course, yearLevel, semester) => {
        // Generate subject ID
        const yearShort = yearLevel.includes('Year')
            ? yearLevel.replace(' Year', '')
            : yearLevel.replace('Grade ', '');
        const semesterShort = semester.includes('Semester')
            ? semester.replace(' Semester', 'Sem')
            : semester;

        const subjectId = `${course}-${yearShort}-${semesterShort}`;

        // Generate subject name
        const subjectName = `${course} ${yearLevel} ${semester}`;

        return { subjectId, subjectName };
    };

    // Effect to update subject ID and name when course, yearLevel, or semester changes
    useEffect(() => {
        if (autoGenerate) {
            const { subjectId, subjectName } = generateSubjectInfo(
                formData.course,
                formData.yearLevel,
                formData.semester
            );

            setFormData(prev => ({
                ...prev,
                subjectId,
                subjectName
            }));
        }
    }, [formData.course, formData.yearLevel, formData.semester, autoGenerate]);

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

    const toggleAutoGenerate = () => {
        setAutoGenerate(!autoGenerate);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Add to Firestore
            const docRef = await addDoc(collection(db, 'subjects'), {
                ...formData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Call the parent callback with the new subject data including the Firestore ID
            onAddSubject({
                id: docRef.id,
                ...formData
            });

            // Close the modal
            onClose();

            // Reset form
            setFormData({
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
        } catch (err) {
            console.error('Error adding subject:', err);
            setError('Failed to add subject. Please try again.');
            toast.error('Failed to add subject!', {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Add New Subject</h3>
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
                            <div className={styles.inputWithCheckbox}>
                                <input
                                    type="text"
                                    id="subjectId"
                                    name="subjectId"
                                    value={formData.subjectId}
                                    onChange={handleInputChange}
                                    required
                                    className={styles.formInput}
                                    disabled={autoGenerate}
                                />
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={autoGenerate}
                                        onChange={toggleAutoGenerate}
                                        className={styles.checkboxInput}
                                    />
                                    Auto-generate
                                </label>
                            </div>
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
                                disabled={autoGenerate}
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

                    {/* Rest of your form remains the same */}
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

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSubject;