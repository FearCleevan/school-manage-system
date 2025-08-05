// src/components/manageStudent/components/StudentTable.jsx
import React, { useState, useEffect } from 'react';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileExcel,
  FaFilePdf,
  FaPrint
} from 'react-icons/fa';
import '../studentManagement.css';

const StudentTable = ({
  students,
  loading,
  sortConfig,
  requestSort,
  formatFullName,
  formatAddress,
  getDepartmentLabel,
  onViewStudent,
  onEditStudent,
  onDeleteStudent,
  onPrintSelected,
  onExportExcelSelected,
  onExportPDFSelected,
  onDeleteSelected,
  visibleColumns = [
    'selection', // Checkbox column included by default
    'studentId',
    'profile',
    'name',
    'address',
    'phone',
    'course',
    'year',
    'semester',
    'department',
    'status',
    'actions'
  ],
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  useEffect(() => {
    if (selectedRows.length === 0) {
      setShowBulkActions(false);
      setSelectAll(false);
    }
  }, [selectedRows]);

  const toggleRowSelection = (studentId) => {
    setSelectedRows(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
    if (!showBulkActions && isColumnVisible('selection')) setShowBulkActions(true);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const allIds = students.map(student => student.id);
      setSelectedRows(allIds);
    }
    setSelectAll(!selectAll);
    if (!showBulkActions && isColumnVisible('selection')) setShowBulkActions(true);
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'print':
        onPrintSelected(selectedRows);
        break;
      case 'excel':
        onExportExcelSelected(selectedRows);
        break;
      case 'pdf':
        onExportPDFSelected(selectedRows);
        break;
      case 'delete':
        onDeleteSelected(selectedRows);
        break;
      default:
        break;
    }
  };

  const isColumnVisible = (key) => visibleColumns.includes(key);

  // Check if all columns are hidden (including selection)
  const allColumnsHidden = visibleColumns.length === 0;

  // Check if only selection column is visible
  const onlySelectionVisible = visibleColumns.length === 1 &&
    visibleColumns[0] === 'selection';

  if (loading) {
    return <div className="loading-indicator">Loading students...</div>;
  }

  return (
    <div className="students-table">
      <table>
        {!allColumnsHidden && !onlySelectionVisible ? (
          <>
            <thead>
              <tr>
                {isColumnVisible('selection') && (
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="row-checkbox"
                    />
                  </th>
                )}

                {isColumnVisible('studentId') && (
                  <th onClick={() => requestSort("studentId")}>
                    <span className="sortable-header">
                      Student ID {renderSortIcon("studentId")}
                    </span>
                  </th>
                )}

                {isColumnVisible('profile') && <th>Profile</th>}

                {isColumnVisible('name') && (
                  <th onClick={() => requestSort("lastName")}>
                    <span className="sortable-header">
                      Full Name {renderSortIcon("lastName")}
                    </span>
                  </th>
                )}

                {isColumnVisible('address') && <th>Address</th>}

                {isColumnVisible('phone') && (
                  <th onClick={() => requestSort("phone")}>
                    <span className="sortable-header">
                      Phone {renderSortIcon("phone")}
                    </span>
                  </th>
                )}

                {isColumnVisible('course') && (
                  <th onClick={() => requestSort("enrollment.course")}>
                    <span className="sortable-header">
                      Course {renderSortIcon("enrollment.course")}
                    </span>
                  </th>
                )}

                {isColumnVisible('year') && (
                  <th onClick={() => requestSort("enrollment.yearLevel")}>
                    <span className="sortable-header">
                      Year {renderSortIcon("enrollment.yearLevel")}
                    </span>
                  </th>
                )}

                {isColumnVisible('semester') && (
                  <th onClick={() => requestSort("enrollment.semester")}>
                    <span className="sortable-header">
                      Semester {renderSortIcon("enrollment.semester")}
                    </span>
                  </th>
                )}

                {isColumnVisible('department') && (
                  <th onClick={() => requestSort("department")}>
                    <span className="sortable-header">
                      Department {renderSortIcon("department")}
                    </span>
                  </th>
                )}

                {isColumnVisible('status') && (
                  <th onClick={() => requestSort("status")}>
                    <span className="sortable-header">
                      Status {renderSortIcon("status")}
                    </span>
                  </th>
                )}

                {isColumnVisible('actions') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className={selectedRows.includes(student.id) ? "selected-row" : ""}>
                    {isColumnVisible('selection') && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(student.id)}
                          onChange={() => toggleRowSelection(student.id)}
                          className="row-checkbox"
                        />
                      </td>
                    )}

                    {isColumnVisible('studentId') && <td>{student.studentId}</td>}

                    {isColumnVisible('profile') && (
                      <td>
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt="Profile"
                            className="profile-image"
                          />
                        ) : (
                          <div className="profile-placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </td>
                    )}

                    {isColumnVisible('name') && <td>{formatFullName(student)}</td>}

                    {isColumnVisible('address') && (
                      <td>
                        {formatAddress(student).length > 12
                          ? `${formatAddress(student).slice(0, 12)}...`
                          : formatAddress(student)}
                      </td>
                    )}

                    {isColumnVisible('phone') && <td>{student.phone}</td>}

                    {isColumnVisible('course') && (
                      <td>{student.enrollment?.course || "Not enrolled"}</td>
                    )}

                    {isColumnVisible('year') && (
                      <td>{student.enrollment?.yearLevel || "Not enrolled"}</td>
                    )}

                    {isColumnVisible('semester') && (
                      <td>{student.enrollment?.semester || "Not enrolled"}</td>
                    )}

                    {isColumnVisible('department') && (
                      <td>{getDepartmentLabel(student.department)}</td>
                    )}

                    {isColumnVisible('status') && (
                      <td>
                        <span className={`status-badge ${student.status.toLowerCase()}`}>
                          {student.status}
                        </span>
                      </td>
                    )}

                    {isColumnVisible('actions') && (
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            title="View"
                            onClick={() => onViewStudent(student)}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="edit-btn"
                            title="Edit"
                            onClick={() => onEditStudent(student)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            title="Delete"
                            onClick={() => onDeleteStudent(student)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length} className="no-data">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </>
        ) : (
          <tbody>
            <tr>
              <td colSpan="1" className="no-columns-message">
                {onlySelectionVisible ? (
                  <>
                    Only selection column visible<br />
                    Please show additional columns via Manage Columns
                  </>
                ) : (
                  "No columns to display"
                )}
              </td>
            </tr>
          </tbody>
        )}
      </table>

      {/* Bulk actions - only shown when checkbox column is visible and rows are selected */}
      {showBulkActions && isColumnVisible('selection') && (
        <div className="bulk-actions-menu">
          <span className="selected-count">{selectedRows.length} selected</span>
          <button
            onClick={() => handleBulkAction('print')}
            className="bulk-action-btn"
          >
            <FaPrint /> Print Selected
          </button>
          <button
            onClick={() => handleBulkAction('excel')}
            className="bulk-action-btn"
          >
            <FaFileExcel /> Export to Excel
          </button>
          <button
            onClick={() => handleBulkAction('pdf')}
            className="bulk-action-btn"
          >
            <FaFilePdf /> Export to PDF
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            className="bulk-action-btn danger"
          >
            <FaTrash /> Delete Selected
          </button>
          <button
            onClick={() => {
              setSelectedRows([]);
              setSelectAll(false);
            }}
            className="bulk-action-btn cancel"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentTable;