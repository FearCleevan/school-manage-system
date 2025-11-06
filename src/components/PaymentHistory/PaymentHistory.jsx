import React, { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaFileExport, FaReceipt, FaFilter, FaCalendarAlt, FaUserGraduate, FaMoneyBillWave, FaPrint, FaDownload, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import styles from './PaymentHistory.module.css';
import { db } from '../../lib/firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';

// Extracted Pagination component matching AllStudents style
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

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        academicYear: '',
        semester: '',
        paymentStatus: '',
        course: '',
        yearLevel: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'datePaid', direction: 'desc' });

    // Filter options
    const filterOptions = {
        academicYear: ['2024-2025', '2023-2024', '2022-2023'],
        semester: ['1st Semester', '2nd Semester', 'Summer'],
        paymentStatus: ['paid', 'partial', 'unpaid'],
        course: ['BSIT', 'BSHM', 'BSBA', 'BSTM', 'BTVTeD-AT', 'BTVTeD-HVACR TECH', 'SHS', 'JHS'],
        yearLevel: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Grade 11', 'Grade 12', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
    };

    // Page size options
    const pageSizeOptions = [5, 10, 20, 50, 100];

    // Fetch students and payments data from Firebase
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch students
                const studentsQuery = query(collection(db, 'students'));
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentsData = studentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudents(studentsData);

                // Process payments from student data - UPDATED FIELD MAPPING
                const allPayments = [];
                studentsData.forEach(student => {
                    if (student.paymentHistory && Array.isArray(student.paymentHistory)) {
                        student.paymentHistory.forEach(payment => {
                            allPayments.push({
                                ...payment,
                                studentId: student.studentId,
                                studentName: `${student.firstName} ${student.lastName}`,
                                course: student.enrollment?.course || 'Not enrolled',
                                yearLevel: student.enrollment?.yearLevel || 'Not enrolled',
                                semester: student.enrollment?.semester || 'Not enrolled',
                                academicYear: student.enrollment?.academicYear || '2024-2025',
                                // Map the fields correctly
                                orNumber: payment.id || payment.orNumber || 'N/A', // Use payment.id as OR Number
                                datePaid: payment.date || payment.datePaid || 'N/A', // Use payment.date as Date Paid
                                processedBy: payment.processedBy || payment.currentUser || 'System', // Use cashier or default
                                type: payment.type || payment.description || 'N/A',
                                amount: payment.amount || 0,
                                remainingBalance: payment.remainingBalance || student.balance || 0,
                                status: payment.status || 'pending',
                                studentData: student // Include full student data for reference
                            });
                        });
                    }
                });

                setPayments(allPayments);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const paidPayments = payments.filter(p => p.status !== 'unpaid');

        return {
            totalToday: paidPayments
                .filter(p => {
                    if (!p.datePaid || p.datePaid === '-') return false;
                    const paymentDate = new Date(p.datePaid).toISOString().split('T')[0];
                    return paymentDate === today;
                })
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            totalThisMonth: paidPayments
                .filter(p => {
                    if (!p.datePaid || p.datePaid === '-') return false;
                    const paymentDate = new Date(p.datePaid);
                    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                })
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            totalOutstanding: students.reduce((sum, student) => sum + (student.balance || 0), 0)
        };
    }, [payments, students]);

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Sort payments
    const sortedPayments = useMemo(() => {
        if (!sortConfig.key) return payments;

        return [...payments].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle different data types for sorting
            if (sortConfig.key === 'datePaid') {
                aValue = aValue === '-' ? 0 : new Date(aValue).getTime();
                bValue = bValue === '-' ? 0 : new Date(bValue).getTime();
            } else if (sortConfig.key === 'amountPaid' || sortConfig.key === 'remainingBalance') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            } else {
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [payments, sortConfig]);

    // Filter payments based on search and filters
    const filteredPayments = useMemo(() => {
        return sortedPayments.filter(payment => {
            const matchesSearch =
                payment.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (payment.orNumber && payment.orNumber.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesFilters =
                (!filters.academicYear || payment.academicYear === filters.academicYear) &&
                (!filters.semester || payment.semester === filters.semester) &&
                (!filters.paymentStatus || payment.status === filters.paymentStatus) &&
                (!filters.course || payment.course === filters.course) &&
                (!filters.yearLevel || payment.yearLevel === filters.yearLevel);

            return matchesSearch && matchesFilters;
        });
    }, [sortedPayments, searchTerm, filters]);

    // Pagination
    const paginationData = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

        return {
            indexOfLastItem,
            indexOfFirstItem,
            currentItems,
            totalPages
        };
    }, [currentPage, itemsPerPage, filteredPayments]);

    // Reset filters
    const resetFilters = () => {
        setFilters({
            academicYear: '',
            semester: '',
            paymentStatus: '',
            course: '',
            yearLevel: ''
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Handle row click to show side panel
    const handleRowClick = (payment) => {
        setSelectedPayment(payment);
        setShowSidePanel(true);
    };

    // Handle view receipt
    const handleViewReceipt = (payment, e) => {
        e.stopPropagation();
        // Implement receipt viewing logic
        console.log('View receipt for:', payment.orNumber);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0);
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'paid': return styles.statusPaid;
            case 'partial': return styles.statusPartial;
            case 'unpaid': return styles.statusUnpaid;
            default: return styles.statusUnknown;
        }
    };

    // Get sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className={styles.sortIcon} />;
        return sortConfig.direction === 'asc' ? <FaSortUp className={styles.sortIcon} /> : <FaSortDown className={styles.sortIcon} />;
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Student ID', 'Student Name', 'OR Number', 'Payment Type', 'Amount Paid', 'Remaining Balance', 'Date Paid', 'Processed By', 'Status'];
        const csvData = filteredPayments.map(payment => [
            payment.studentId,
            payment.studentName,
            payment.orNumber,
            payment.paymentType || payment.type || 'N/A',
            payment.amount || 0,
            payment.remainingBalance || 0,
            payment.datePaid ? new Date(payment.datePaid).toLocaleDateString() : 'N/A',
            payment.processedBy,
            payment.status || 'unknown'
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className={styles.loading} aria-live="polite">
                <div className={styles.spinner} aria-hidden="true" />
                Loading payment history...
            </div>
        );
    }

    return (
        <div className={styles.paymentHistoryContainer}>
            {/* Table Controls */}
            <div className={styles.tableControls}>
                <div className={styles.leftControls}>
                    <div className={styles.searchBar}>
                        <FaSearch className={styles.searchIcon} aria-hidden="true" />
                        <input
                            id="paymentSearch"
                            type="text"
                            placeholder="Search by Student ID, Name, or OR Number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search payments by student ID, name or OR number"
                        />
                    </div>

                    <div className={styles.filterControls}>
                        <div className={styles.filterDropdown}>
                            <label htmlFor="academicYear">Academic Year</label>
                            <select
                                id="academicYear"
                                value={filters.academicYear}
                                onChange={(e) => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
                                aria-label="Filter by academic year"
                            >
                                <option value="">All Years</option>
                                {filterOptions.academicYear.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterDropdown}>
                            <label htmlFor="semester">Semester</label>
                            <select
                                id="semester"
                                value={filters.semester}
                                onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                                aria-label="Filter by semester"
                            >
                                <option value="">All Semesters</option>
                                {filterOptions.semester.map(sem => (
                                    <option key={sem} value={sem}>{sem}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterDropdown}>
                            <label htmlFor="paymentStatus">Payment Status</label>
                            <select
                                id="paymentStatus"
                                value={filters.paymentStatus}
                                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                aria-label="Filter by payment status"
                            >
                                <option value="">All Status</option>
                                {filterOptions.paymentStatus.map(status => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterDropdown}>
                            <label htmlFor="course">Course</label>
                            <select
                                id="course"
                                value={filters.course}
                                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                                aria-label="Filter by course"
                            >
                                <option value="">All Courses</option>
                                {filterOptions.course.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterDropdown}>
                            <label htmlFor="yearLevel">Year Level</label>
                            <select
                                id="yearLevel"
                                value={filters.yearLevel}
                                onChange={(e) => setFilters(prev => ({ ...prev, yearLevel: e.target.value }))}
                                aria-label="Filter by year level"
                            >
                                <option value="">All Levels</option>
                                {filterOptions.yearLevel.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className={styles.resetFiltersBtn}
                            onClick={resetFilters}
                            disabled={!searchTerm && !Object.values(filters).some(value => value !== '')}
                            aria-label="Reset all filters"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                <div className={styles.rightControls}>
                    <button
                        className={styles.exportButton}
                        onClick={exportToCSV}
                        aria-label="Export to CSV"
                    >
                        <FaFileExport aria-hidden="true" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summarySection}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>
                        <FaMoneyBillWave />
                    </div>
                    <div className={styles.summaryContent}>
                        <h3 className={styles.summaryValue}>{formatCurrency(summaryStats.totalToday)}</h3>
                        <p className={styles.summaryLabel}>Total Payments Today</p>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>
                        <FaCalendarAlt />
                    </div>
                    <div className={styles.summaryContent}>
                        <h3 className={styles.summaryValue}>{formatCurrency(summaryStats.totalThisMonth)}</h3>
                        <p className={styles.summaryLabel}>Total This Month</p>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>
                        <FaUserGraduate />
                    </div>
                    <div className={styles.summaryContent}>
                        <h3 className={styles.summaryValue}>{formatCurrency(summaryStats.totalOutstanding)}</h3>
                        <p className={styles.summaryLabel}>Outstanding Balance</p>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className={styles.paymentsTable}>
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
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                    <span>entries</span>
                </div>

                <div className={styles.tableWrapper}>
                    <table aria-label="Payment history">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('studentId')}>
                                    <span className={styles.sortableHeader}>
                                        Student ID {getSortIcon('studentId')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('studentName')}>
                                    <span className={styles.sortableHeader}>
                                        Student Name {getSortIcon('studentName')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('orNumber')}>
                                    <span className={styles.sortableHeader}>
                                        OR Number {getSortIcon('orNumber')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('type')}>
                                    <span className={styles.sortableHeader}>
                                        Payment Type {getSortIcon('type')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('amount')}>
                                    <span className={styles.sortableHeader}>
                                        Amount Paid {getSortIcon('amount')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('remainingBalance')}>
                                    <span className={styles.sortableHeader}>
                                        Remaining Balance {getSortIcon('remainingBalance')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('datePaid')}>
                                    <span className={styles.sortableHeader}>
                                        Date Paid {getSortIcon('datePaid')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('processedBy')}>
                                    <span className={styles.sortableHeader}>
                                        Processed By {getSortIcon('processedBy')}
                                    </span>
                                </th>
                                <th onClick={() => handleSort('status')}>
                                    <span className={styles.sortableHeader}>
                                        Status {getSortIcon('status')}
                                    </span>
                                </th>
                                <th>Actions</th>
                            </tr>

                        </thead>
                        <tbody>
                            {paginationData.currentItems.length > 0 ? (
                                paginationData.currentItems.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className={styles.tableRow}
                                        onClick={() => handleRowClick(payment)}
                                    >
                                        <td>{payment.studentId}</td>
                                        <td className={styles.studentName}>{payment.studentName}</td>
                                        <td>{payment.orNumber || 'N/A'}</td>
                                        <td>{payment.type || payment.description || 'N/A'}</td>
                                        <td className={styles.amount}>{formatCurrency(payment.amount)}</td>
                                        <td className={styles.amount}>{formatCurrency(payment.remainingBalance)}</td>
                                        <td>{payment.datePaid ? new Date(payment.datePaid).toLocaleDateString() : 'N/A'}</td>
                                        <td>{payment.processedBy || 'N/A'}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${getStatusBadgeClass(payment.status)}`}>
                                                {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.receiptButton}
                                                onClick={(e) => handleViewReceipt(payment, e)}
                                                aria-label={`View receipt for ${payment.studentName}`}
                                            >
                                                <FaReceipt />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className={styles.noResults}>
                                        {payments.length === 0 ? 'No payment records found' : 'No payment records found matching your criteria'}
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
                totalItems={filteredPayments.length}
                indexOfFirstItem={paginationData.indexOfFirstItem}
                indexOfLastItem={paginationData.indexOfLastItem}
            />

            {/* Side Panel */}
            {showSidePanel && selectedPayment && (
                <div className={styles.sidePanelOverlay} onClick={() => setShowSidePanel(false)}>
                    <div className={styles.sidePanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.sidePanelHeader}>
                            <h3>Payment Details</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowSidePanel(false)}
                                aria-label="Close payment details"
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.sidePanelContent}>
                            {/* Student Profile */}
                            <div className={styles.studentProfile}>
                                <div className={styles.profileImage}>
                                    {selectedPayment.studentName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={styles.profileInfo}>
                                    <h4>{selectedPayment.studentName}</h4>
                                    <p>ID: {selectedPayment.studentId}</p>
                                    <p>{selectedPayment.course} • {selectedPayment.yearLevel}</p>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className={styles.paymentDetails}>
                                <h4>Payment Information</h4>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>OR Number:</span>
                                        <span className={styles.detailValue}>{selectedPayment.orNumber || 'N/A'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Payment Type:</span>
                                        <span className={styles.detailValue}>{selectedPayment.type || selectedPayment.description || 'N/A'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Amount Paid:</span>
                                        <span className={styles.detailValue}>{formatCurrency(selectedPayment.amount)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Remaining Balance:</span>
                                        <span className={styles.detailValue}>{formatCurrency(selectedPayment.remainingBalance)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Date Paid:</span>
                                        <span className={styles.detailValue}>
                                            {selectedPayment.datePaid ? new Date(selectedPayment.datePaid).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Processed By:</span>
                                        <span className={styles.detailValue}>{selectedPayment.processedBy || 'N/A'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Status:</span>
                                        <span className={`${styles.detailValue} ${getStatusBadgeClass(selectedPayment.status)}`}>
                                            {selectedPayment.status ? selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1) : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Academic Year:</span>
                                        <span className={styles.detailValue}>{selectedPayment.academicYear || 'N/A'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Semester:</span>
                                        <span className={styles.detailValue}>{selectedPayment.semester || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.sidePanelActions}>
                                <button className={styles.printButton}>
                                    <FaPrint /> Print Receipt
                                </button>
                                <button className={styles.downloadButton}>
                                    <FaDownload /> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;