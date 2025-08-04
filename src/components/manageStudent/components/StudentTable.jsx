// src/components/manageStudent/components/StudentTable.jsx
import React, { useState, useEffect } from 'react';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPrint,
  FaFileExcel,
  FaFilePdf
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
  onDeleteSelected
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  useEffect(() => {
    // Hide bulk actions when no rows are selected
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
    if (!showBulkActions) setShowBulkActions(true);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const allIds = students.map(student => student.id);
      setSelectedRows(allIds);
    }
    setSelectAll(!selectAll);
    if (!showBulkActions) setShowBulkActions(true);
  };

  const handleBulkAction = (action) => {
    switch(action) {
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

  if (loading) {
    return <div className="loading-indicator">Loading students...</div>;
  }

  return (
    <div className="students-table">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="row-checkbox"
              />
            </th>
            <th onClick={() => requestSort("studentId")}>
              Student ID {renderSortIcon("studentId")}
            </th>
            <th>Profile</th>
            <th onClick={() => requestSort("lastName")}>
              Full Name {renderSortIcon("lastName")}
            </th>
            <th>Address</th>
            <th onClick={() => requestSort("phone")}>
              Phone {renderSortIcon("phone")}
            </th>
            <th onClick={() => requestSort("enrollment.course")}>
              Course {renderSortIcon("enrollment.course")}
            </th>
            <th onClick={() => requestSort("enrollment.yearLevel")}>
              Year {renderSortIcon("enrollment.yearLevel")}
            </th>
            <th onClick={() => requestSort("enrollment.semester")}>
              Semester {renderSortIcon("enrollment.semester")}
            </th>
            <th onClick={() => requestSort("department")}>
              Department {renderSortIcon("department")}
            </th>
            <th onClick={() => requestSort("status")}>
              Status {renderSortIcon("status")}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length > 0 ? (
            students.map((student) => (
              <tr key={student.id} className={selectedRows.includes(student.id) ? "selected-row" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(student.id)}
                    onChange={() => toggleRowSelection(student.id)}
                    className="row-checkbox"
                  />
                </td>
                <td>{student.studentId}</td>
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
                <td>{formatFullName(student)}</td>
                <td>
                  {formatAddress(student).length > 12
                    ? `${formatAddress(student).slice(0, 12)}...`
                    : formatAddress(student)}
                </td>
                <td>{student.phone}</td>
                <td>{student.enrollment?.course || "Not enrolled"}</td>
                <td>{student.enrollment?.yearLevel || "Not enrolled"}</td>
                <td>{student.enrollment?.semester || "Not enrolled"}</td>
                <td>{getDepartmentLabel(student.department)}</td>
                <td>
                  <span className={`status-badge ${student.status.toLowerCase()}`}>
                    {student.status}
                  </span>
                </td>
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" className="no-data">
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bulk Actions Menu */}
      {showBulkActions && (
        <div className="bulk-actions-menu">
          <span className="selected-count">{selectedRows.length} selected</span>
          <button onClick={() => handleBulkAction('print')} className="bulk-action-btn">
            <FaPrint /> Print Selected
          </button>
          <button onClick={() => handleBulkAction('excel')} className="bulk-action-btn">
            <FaFileExcel /> Export to Excel
          </button>
          <button onClick={() => handleBulkAction('pdf')} className="bulk-action-btn">
            <FaFilePdf /> Export to PDF
          </button>
          <button onClick={() => handleBulkAction('delete')} className="bulk-action-btn danger">
            <FaTrash /> Delete Selected
          </button>
          <button onClick={() => {
            setSelectedRows([]);
            setSelectAll(false);
          }} className="bulk-action-btn cancel">
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentTable;