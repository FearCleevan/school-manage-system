import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaFileExcel, FaFilePdf, FaPrint,
  FaEye, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaPlus
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import './subjects.css';
import AddSubject from '../modals/AddSubject';
import ViewSubject from '../modals/ViewSubject';
import EditSubject from '../modals/EditSubject';

const Subjects = () => {
  // State management
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'subjectId', direction: 'asc' });
  const [showAddModal, setShowAddModal] = useState(false);

  const [viewingSubject, setViewingSubject] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingSubject, setEditingSubject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleUpdateSubject = (updatedSubject) => {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === updatedSubject.id ? updatedSubject : subject
      )
    );
  };

  // Available courses and filters
  const courses = ['All', 'BSIT', 'BSHM', 'BSBA', 'BSTM', 'BTVTeD-AT', 'BTVTeD-HVACR TECH', 'BTVTeD-FSM', 'BTVTeD-ET', 'SHS', 'JHS'];
  const yearLevels = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Grade 11', 'Grade 12'];
  const semesters = ['All', '1st Semester', '2nd Semester', 'Summer'];
  const statuses = ['All', 'Active', 'Inactive'];

  const [filters, setFilters] = useState({
    course: 'All',
    yearLevel: 'All',
    semester: 'All',
    status: 'All'
  });

  // Fetch subjects from Firestore
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const subjectsCollection = collection(db, 'subjects');
        const querySnapshot = await getDocs(subjectsCollection);

        const subjectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSubjects(subjectsData);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Sort function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted data
  const getSortedData = () => {
    const sortableItems = [...subjects];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  };

  // Filter subjects
  const filteredSubjects = getSortedData().filter(subject => {
    const matchesSearch =
      (subject.subjectId && subject.subjectId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subject.subjectName && subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subject.course && subject.course.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilters =
      (filters.course === 'All' || subject.course === filters.course) &&
      (filters.yearLevel === 'All' || subject.yearLevel === filters.yearLevel) &&
      (filters.semester === 'All' || subject.semester === filters.semester) &&
      (filters.status === 'All' || subject.status === filters.status);

    return matchesSearch && matchesFilters;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render sort icon
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
    setCurrentPage(1);
  };

  const handleAddSubject = (newSubject) => {
    setSubjects(prev => [...prev, newSubject]);
  };

  if (loading) {
    return <div className="loading">Loading subjects...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="subjects-container">
      <div className="subjects-management">
        <h2 className="management-header">Subjects Management</h2>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Course:</label>
            <select
              value={filters.course}
              onChange={(e) => handleFilterChange('course', e.target.value)}
            >
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year Level:</label>
            <select
              value={filters.yearLevel}
              onChange={(e) => handleFilterChange('yearLevel', e.target.value)}
            >
              {yearLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Semester:</label>
            <select
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Controls */}
        <div className="table-controls">
          <div className="left-controls">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              className="add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus /> Add Subject
            </button>
          </div>

          <div className="right-controls">
            <div className="items-per-page">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 20, 50].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span>entries</span>
            </div>

            <div className="export-buttons">
              <CSVLink
                data={filteredSubjects}
                filename="subjects-list.csv"
                className="export-btn"
              >
                <FaFileExcel /> Excel
              </CSVLink>
              <button className="export-btn">
                <FaFilePdf /> PDF
              </button>
              <button className="export-btn">
                <FaPrint /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="subjects-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('subjectId')}>
                  Subject ID {renderSortIcon('subjectId')}
                </th>
                <th onClick={() => requestSort('subjectName')}>
                  Subject Name {renderSortIcon('subjectName')}
                </th>
                <th onClick={() => requestSort('course')}>
                  Course {renderSortIcon('course')}
                </th>
                <th onClick={() => requestSort('yearLevel')}>
                  Year Level {renderSortIcon('yearLevel')}
                </th>
                <th onClick={() => requestSort('semester')}>
                  Semester {renderSortIcon('semester')}
                </th>
                <th onClick={() => requestSort('status')}>
                  Status {renderSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map(subject => (
                  <tr key={subject.id}>
                    <td>{subject.subjectId}</td>
                    <td>{subject.subjectName}</td>
                    <td>{subject.course}</td>
                    <td>{subject.yearLevel}</td>
                    <td>{subject.semester}</td>
                    <td>
                      <span className={`status-badge ${subject.status.toLowerCase()}`}>
                        {subject.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          title="View"
                          onClick={() => {
                            setViewingSubject(subject);
                            setShowViewModal(true);
                          }}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="edit-btn"
                          title="Edit"
                          onClick={() => {
                            setEditingSubject(subject);
                            setShowEditModal(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button className="delete-btn" title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    {subjects.length === 0 ? 'No subjects found in database' : 'No subjects match your criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubjects.length)} of {filteredSubjects.length} entries
            </div>
            <div className="pagination-buttons">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                First
              </button>
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
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
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      <AddSubject
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddSubject={handleAddSubject}
      />

      <ViewSubject
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        subject={viewingSubject}
      />

      <EditSubject
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        subject={editingSubject}
        onUpdateSubject={handleUpdateSubject}
      />
    </div>
  );
};

export default Subjects;