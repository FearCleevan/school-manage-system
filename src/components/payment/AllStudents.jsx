// src/components/payment/AllStudents.jsx
import React, { useState, useEffect } from 'react';
import styles from './AllStudents.module.css';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { db } from '../../lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// Department mapping (Firestore value -> Display value)
const departmentMapping = {
  'college': 'College',
  'tvet': 'TVET',
  'shs': 'SHS',
  'jhs': 'JHS'
};

// Course options organized by department
const courseOptions = {
  'college': ['BSIT', 'BSHM', 'BSBA', 'BSTM'],
  'tvet': ['BTVTeD-AT', 'BTVTeD-HVACR TECH', 'BTVTeD-FSM', 'BTVTeD-ET'],
  'shs': ['SHS'],
  'jhs': ['JHS']
};

// Department options for filter dropdown
const departmentOptions = [
  { value: 'college', label: 'College' },
  { value: 'tvet', label: 'TVET' },
  { value: 'shs', label: 'SHS' },
  { value: 'jhs', label: 'JHS' }
];

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Format department for display
          formattedDepartment: departmentMapping[doc.data().department] || 'Not assigned'
        }));
        setStudents(studentsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = courseFilter ? student.enrollment?.course === courseFilter : true;
    const matchesDepartment = departmentFilter ? student.department === departmentFilter : true;
    
    return matchesSearch && matchesCourse && matchesDepartment;
  });

  // Get available courses based on selected department
  const getAvailableCourses = () => {
    if (!departmentFilter) {
      return Object.values(courseOptions).flat();
    }
    return courseOptions[departmentFilter] || [];
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setCourseFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  if (loading) {
    return <div className={styles.loading}>Loading students...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.allStudentsContainer}>
      {/* Table Controls */}
      <div className={styles.tableControls}>
        <div className={styles.leftControls}>
          <div className={styles.searchBar}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterDropdown}>
              <label>Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCourseFilter('');
                  setCurrentPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departmentOptions.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterDropdown}>
              <label>Course</label>
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!departmentFilter}
              >
                <option value="">All Courses</option>
                {getAvailableCourses().map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <button
              className={styles.resetFiltersBtn}
              onClick={resetFilters}
              disabled={!searchTerm && !courseFilter && !departmentFilter}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className={styles.rightControls}>
          <button className={styles.addPaymentBtn}>
            <FaPlus /> Add New Payment
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className={styles.studentsTable}>
        <div className={styles.showEntries}>
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>entries</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Course</th>
              <th>Year</th>
              <th>Semester</th>
              <th>Department</th>
              <th>Payment Details</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map(student => (
                <tr key={student.id}>
                  <td>{student.studentId}</td>
                  <td>{`${student.firstName} ${student.lastName}`}</td>
                  <td>{student.enrollment?.course || 'Not enrolled'}</td>
                  <td>{student.enrollment?.yearLevel || 'Not enrolled'}</td>
                  <td>{student.enrollment?.semester || 'Not enrolled'}</td>
                  <td>{student.formattedDepartment}</td>
                  <td>
                    <button className={styles.detailsBtn}>...</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={styles.noResults}>No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.paginationContainer}>
        

        <div className={styles.paginationInfo}>
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
        </div>

        <div className={styles.paginationButtons}>
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
          >
            First
          </button>
          <button
            onClick={() => paginate(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={currentPage === pageNum ? styles.active : ''}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllStudents;