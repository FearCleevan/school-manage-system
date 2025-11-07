import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './AllStudents.module.css';
import { FaSearch, FaPlus, FaMoneyBillWave, FaSyncAlt, FaFilter, FaExclamationTriangle } from 'react-icons/fa';
import { db } from '../../lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import PaymentDetails from './PaymentDetails';

// Constants configuration
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
  pageSizeOptions: [5, 10, 20, 50, 100],
  balanceFilterOptions: [
    { value: '', label: 'All Balances' },
    { value: 'has-balance', label: 'Has Balance' },
    { value: 'no-balance', label: 'No Balance' },
    { value: 'overdue', label: 'Overdue' }
  ]
};

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  paginate,
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
          className={styles.paginationButton}
          aria-label="First page"
        >
          First
        </button>
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={styles.paginationButton}
          aria-label="Previous page"
        >
          Previous
        </button>

        {getPageNumbers().map(pageNum => (
          <button
            key={pageNum}
            onClick={() => paginate(pageNum)}
            className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}`}
            aria-label={`Page ${pageNum}`}
            aria-current={currentPage === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={styles.paginationButton}
          aria-label="Next page"
        >
          Next
        </button>
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          className={styles.paginationButton}
          aria-label="Last page"
        >
          Last
        </button>
      </div>
    </div>
  );
};

// Student Financial Status Badge
const FinancialStatusBadge = ({ balance, totalDue }) => {
  if (totalDue === 0) return <span className={`${styles.statusBadge} ${styles.notEnrolled}`}>Not Enrolled</span>;
  if (balance === 0) return <span className={`${styles.statusBadge} ${styles.paid}`}>Paid</span>;
  if (balance > 0 && balance < totalDue) return <span className={`${styles.statusBadge} ${styles.partial}`}>Partial</span>;
  if (balance >= totalDue) return <span className={`${styles.statusBadge} ${styles.overdue}`}>Overdue</span>;
  return <span className={styles.statusBadge}>Pending</span>;
};

// Recalculate Fees Function
const recalculateStudentFees = async (studentId) => {
  try {
    // Update the lastUpdated timestamp to trigger recalculation
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      'financialSummary.lastUpdated': new Date()
    });
    return true;
  } catch (error) {
    console.error('Error recalculating fees:', error);
    throw error;
  }
};

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recalculating, setRecalculating] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Fetch students from Firestore with enhanced financial data
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure financial summary exists with proper defaults
        const financialSummary = data.financialSummary || {
          totalTuition: 0,
          totalFees: 0,
          totalDiscount: 0,
          totalAmountDue: 0,
          totalPaid: 0,
          remainingBalance: 0,
          lastUpdated: new Date()
        };

        // Calculate status based on financial data
        const status = financialSummary.totalAmountDue === 0 ? 'not-enrolled' :
                      financialSummary.remainingBalance === 0 ? 'paid' :
                      financialSummary.remainingBalance > 0 && financialSummary.remainingBalance < financialSummary.totalAmountDue ? 'partial' :
                      'overdue';

        return {
          id: doc.id,
          ...data,
          formattedDepartment: config.departmentMapping[data.department] || 'Not assigned',
          financialSummary: {
            ...financialSummary,
            // Ensure all values are numbers
            totalTuition: Number(financialSummary.totalTuition) || 0,
            totalFees: Number(financialSummary.totalFees) || 0,
            totalDiscount: Number(financialSummary.totalDiscount) || 0,
            totalAmountDue: Number(financialSummary.totalAmountDue) || 0,
            totalPaid: Number(financialSummary.totalPaid) || 0,
            remainingBalance: Number(financialSummary.remainingBalance) || 0,
            lastUpdated: financialSummary.lastUpdated || new Date()
          },
          financialStatus: status
        };
      });

      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Get available courses based on selected department
  const getAvailableCourses = useCallback(() => {
    if (!departmentFilter) {
      return Array.from(new Set(Object.values(config.courseOptions).flat()));
    }
    return config.courseOptions[departmentFilter] || [];
  }, [departmentFilter]);

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.studentId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesCourse = courseFilter ? student.enrollment?.course === courseFilter : true;
      const matchesDepartment = departmentFilter ? student.department === departmentFilter : true;
      
      const matchesBalance = balanceFilter ? 
        (balanceFilter === 'has-balance' ? student.financialSummary.remainingBalance > 0 : 
         balanceFilter === 'no-balance' ? student.financialSummary.remainingBalance <= 0 : true) : true;

      const matchesStatus = statusFilter ? student.financialStatus === statusFilter : true;

      return matchesSearch && matchesCourse && matchesDepartment && matchesBalance && matchesStatus;
    });
  }, [students, debouncedSearchTerm, courseFilter, departmentFilter, balanceFilter, statusFilter]);

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

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setCourseFilter('');
    setDepartmentFilter('');
    setBalanceFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  }, []);

  // Handle opening payment modal
  const handleOpenPaymentModal = useCallback((student) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
  }, []);

  // Handle recalculating fees for a student
  const handleRecalculateFees = async (studentId, e) => {
    if (e) e.stopPropagation();
    
    setRecalculating(studentId);
    try {
      await recalculateStudentFees(studentId);
      // Refresh the student data
      await fetchStudents();
    } catch (error) {
      console.error('Error recalculating fees:', error);
      setError('Failed to recalculate fees. Please try again.');
    } finally {
      setRecalculating(null);
    }
  };

  // Status filter options
  const statusFilterOptions = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Fully Paid' },
    { value: 'partial', label: 'Partial Payment' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'not-enrolled', label: 'Not Enrolled' }
  ];

  if (loading) {
    return (
      <div className={styles.loading} aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        Loading students...
      </div>
    );
  }

  return (
    <div className={styles.allStudentsContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <h1 className={styles.title}>Student Financial Management</h1>
        <p className={styles.subtitle}>
          Manage student payments, view balances, and track financial status
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={fetchStudents} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Statistics Overview */}
      <div className={styles.statsOverview}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{students.length}</div>
          <div className={styles.statLabel}>Total Students</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {students.filter(s => s.financialSummary.remainingBalance > 0).length}
          </div>
          <div className={styles.statLabel}>With Balance</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {students.filter(s => s.financialSummary.remainingBalance === 0 && s.financialSummary.totalAmountDue > 0).length}
          </div>
          <div className={styles.statLabel}>Fully Paid</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            ₱{students.reduce((sum, student) => sum + student.financialSummary.totalPaid, 0).toLocaleString()}
          </div>
          <div className={styles.statLabel}>Total Collected</div>
        </div>
      </div>

      {/* Table Controls */}
      <div className={styles.tableControls}>
        <div className={styles.leftControls}>
          <div className={styles.searchBar}>
            <FaSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              id="studentSearch"
              type="text"
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search students"
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label htmlFor="departmentFilter" className={styles.filterLabel}>
                <FaFilter /> Department
              </label>
              <select
                id="departmentFilter"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCourseFilter('');
                  setCurrentPage(1);
                }}
                className={styles.filterSelect}
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

            <div className={styles.filterGroup}>
              <label htmlFor="courseFilter" className={styles.filterLabel}>
                Course
              </label>
              <select
                id="courseFilter"
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!departmentFilter}
                className={styles.filterSelect}
                aria-label="Filter by course"
              >
                <option value="">All Courses</option>
                {getAvailableCourses().map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="balanceFilter" className={styles.filterLabel}>
                Balance
              </label>
              <select
                id="balanceFilter"
                value={balanceFilter}
                onChange={(e) => {
                  setBalanceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.filterSelect}
                aria-label="Filter by balance status"
              >
                {config.balanceFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="statusFilter" className={styles.filterLabel}>
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.filterSelect}
                aria-label="Filter by payment status"
              >
                {statusFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className={styles.resetFiltersBtn}
              onClick={resetFilters}
              disabled={!searchTerm && !courseFilter && !departmentFilter && !balanceFilter && !statusFilter}
              aria-label="Reset all filters"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className={styles.rightControls}>
          <button
            className={styles.refreshButton}
            onClick={fetchStudents}
            aria-label="Refresh data"
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className={styles.studentsTable}>
        <div className={styles.tableHeader}>
          <div className={styles.showEntries}>
            <label htmlFor="itemsPerPage">Show</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.itemsSelect}
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
          
          <div className={styles.tableSummary}>
            {filteredStudents.length} student(s) found
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table} aria-label="Students list">
            <thead>
              <tr>
                <th scope="col">Student ID</th>
                <th scope="col">Full Name</th>
                <th scope="col">Course</th>
                <th scope="col">Year</th>
                <th scope="col">Department</th>
                <th scope="col" className={styles.amountColumn}>Total Due</th>
                <th scope="col" className={styles.amountColumn}>Total Paid</th>
                <th scope="col" className={styles.amountColumn}>Balance</th>
                <th scope="col">Status</th>
                <th scope="col" className={styles.actionsColumn}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginationData.currentItems.length > 0 ? (
                paginationData.currentItems.map(student => (
                  <tr key={student.id} className={styles.studentRow}>
                    <td className={styles.studentId}>{student.studentId}</td>
                    <td className={styles.studentName}>
                      <div className={styles.namePrimary}>
                        {student.firstName} {student.lastName}
                      </div>
                      {student.email && (
                        <div className={styles.nameSecondary}>{student.email}</div>
                      )}
                    </td>
                    <td>{student.enrollment?.course || 'Not enrolled'}</td>
                    <td>{student.enrollment?.yearLevel || '-'}</td>
                    <td>{student.formattedDepartment}</td>
                    <td className={styles.amountCell}>
                      ₱{student.financialSummary.totalAmountDue.toLocaleString()}
                    </td>
                    <td className={styles.amountCell}>
                      ₱{student.financialSummary.totalPaid.toLocaleString()}
                    </td>
                    <td className={`${styles.amountCell} ${
                      student.financialSummary.remainingBalance > 0 ? styles.hasBalance : styles.noBalance
                    }`}>
                      ₱{student.financialSummary.remainingBalance.toLocaleString()}
                    </td>
                    <td>
                      <FinancialStatusBadge 
                        balance={student.financialSummary.remainingBalance}
                        totalDue={student.financialSummary.totalAmountDue}
                      />
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.detailsBtn}
                          onClick={() => handleOpenPaymentModal(student)}
                          aria-label={`View payment details for ${student.firstName} ${student.lastName}`}
                          title="View Payment Details"
                        >
                          <FaMoneyBillWave />
                        </button>
                        <button
                          className={styles.recalculateBtn}
                          onClick={(e) => handleRecalculateFees(student.id, e)}
                          disabled={recalculating === student.id}
                          aria-label={`Recalculate fees for ${student.firstName} ${student.lastName}`}
                          title="Recalculate Fees"
                        >
                          <FaSyncAlt className={recalculating === student.id ? styles.spinning : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className={styles.noResults}>
                    <div className={styles.noResultsContent}>
                      <div className={styles.noResultsIcon}>📊</div>
                      <div className={styles.noResultsText}>
                        No students found matching your criteria
                      </div>
                      <button
                        className={styles.noResultsAction}
                        onClick={resetFilters}
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationData.totalPages}
          paginate={setCurrentPage}
          totalItems={filteredStudents.length}
          indexOfFirstItem={paginationData.indexOfFirstItem}
          indexOfLastItem={paginationData.indexOfLastItem}
        />
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && selectedStudent && (
        <PaymentDetails
          student={selectedStudent}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedStudent(null);
          }}
          onDataUpdate={fetchStudents}
        />
      )}
    </div>
  );
};

export default AllStudents;