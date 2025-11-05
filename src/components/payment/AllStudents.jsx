import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './AllStudents.module.css';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { db } from '../../lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import PaymentDetails from './PaymentDetails';

// Constants moved to a separate configuration object
const config = {
  departmentMapping: {
    'college': 'College',
    'tvet': 'TVET',
    'shs': 'SHS',
    'jhs': 'JHS'
  },
  courseOptions: {
    'college': ['BSIT', 'BSHM', 'BSBA', 'BSTM'],
    'tvet': ['BTVTeD-AT', 'BTVTeD-HVACR TECH', 'BTVTeD-FSM', 'BTVTeD-ET'],
    'shs': ['SHS'],
    'jhs': ['JHS']
  },
  departmentOptions: [
    { value: 'college', label: 'College' },
    { value: 'tvet', label: 'TVET' },
    { value: 'shs', label: 'SHS' },
    { value: 'jhs', label: 'JHS' }
  ],
  pageSizeOptions: [5, 10, 20, 50, 100]
};

// Extracted Pagination component for better reusability
const Pagination = ({
  currentPage,
  totalPages,
  paginate,
  itemsPerPage,
  totalItems,
  indexOfFirstItem,
  indexOfLastItem
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisiblePages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.paginationInfo}>
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
      </div>

      <div className={styles.paginationButtons}>
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          First
        </button>
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          Previous
        </button>

        {getPageNumbers().map(pageNum => (
          <button
            key={pageNum}
            onClick={() => paginate(pageNum)}
            className={currentPage === pageNum ? styles.active : ''}
            aria-label={`Page ${pageNum}`}
            aria-current={currentPage === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next
        </button>
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          Last
        </button>
      </div>
    </div>
  );
};

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch students from Firestore with error handling
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedDepartment: config.departmentMapping[doc.data().department] || 'Not assigned'
        }));
        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.studentId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesCourse = courseFilter ? student.enrollment?.course === courseFilter : true;
      const matchesDepartment = departmentFilter ? student.department === departmentFilter : true;

      return matchesSearch && matchesCourse && matchesDepartment;
    });
  }, [students, debouncedSearchTerm, courseFilter, departmentFilter]);

  // Memoized pagination data
  const paginationData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    return {
      indexOfLastItem,
      indexOfFirstItem,
      currentItems,
      totalPages
    };
  }, [currentPage, itemsPerPage, filteredStudents]);

  // Get available courses based on selected department
  const getAvailableCourses = useCallback(() => {
    if (!departmentFilter) {
      return Object.values(config.courseOptions).flat();
    }
    return config.courseOptions[departmentFilter] || [];
  }, [departmentFilter]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setCourseFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  }, []);

  // Handle opening payment modal
  const handleOpenPaymentModal = useCallback((student) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
  }, []);

  if (loading) {
    return (
      <div className={styles.loading} aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        Loading students...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        {error}
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.allStudentsContainer}>
      {/* Table Controls */}
      <div className={styles.tableControls}>
        <div className={styles.leftControls}>
          <div className={styles.searchBar}>
            <FaSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              id="studentSearch"
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search students by ID or name"
            />
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterDropdown}>
              <label htmlFor="departmentFilter">Department</label>
              <select
                id="departmentFilter"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCourseFilter('');
                  setCurrentPage(1);
                }}
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {config.departmentOptions.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterDropdown}>
              <label htmlFor="courseFilter">Course</label>
              <select
                id="courseFilter"
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!departmentFilter}
                aria-label="Filter by course"
                aria-disabled={!departmentFilter}
              >
                <option value="">All Courses</option>
                {getAvailableCourses().map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <button
              className={styles.resetFiltersBtn}
              onClick={resetFilters}
              disabled={!searchTerm && !courseFilter && !departmentFilter}
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className={styles.rightControls}>
          <button
            className={styles.addPaymentBtn}
            aria-label="Add new payment"
          >
            <FaPlus aria-hidden="true" /> Add New Payment
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className={styles.studentsTable}>
        <div className={styles.showEntries}>
          <label htmlFor="itemsPerPage">Show</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Items per page"
          >
            {config.pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className={styles.tableWrapper}>
          <table aria-label="Students list">
            <thead>
              <tr>
                <th scope="col">Student ID</th>
                <th scope="col">Full Name</th>
                <th scope="col">Course</th>
                <th scope="col">Year</th>
                <th scope="col">Semester</th>
                <th scope="col">Department</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginationData.currentItems.length > 0 ? (
                paginationData.currentItems.map(student => (
                  <tr key={student.id}>
                    <td>{student.studentId}</td>
                    <td>{`${student.firstName} ${student.lastName}`}</td>
                    <td>{student.enrollment?.course || 'Not enrolled'}</td>
                    <td>{student.enrollment?.yearLevel || 'Not enrolled'}</td>
                    <td>{student.enrollment?.semester || 'Not enrolled'}</td>
                    <td>{student.formattedDepartment}</td>
                    <td>
                      <button
                        className={styles.detailsBtn}
                        onClick={() => handleOpenPaymentModal(student)}
                        aria-label={`View payment details for ${student.firstName} ${student.lastName}`}
                      >
                        ...
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.noResults}>
                    No students found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={paginationData.totalPages}
        paginate={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredStudents.length}
        indexOfFirstItem={paginationData.indexOfFirstItem}
        indexOfLastItem={paginationData.indexOfLastItem}
      />

      {/* Payment Details Modal */}
      {showPaymentModal && (
        <PaymentDetails
          student={selectedStudent}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default AllStudents;