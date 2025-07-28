//src/components/manageStudent/components/StudentTable.jsx
import React from 'react';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown
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
  onDeleteStudent
}) => {
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading) {
    return <div className="loading-indicator">Loading students...</div>;
  }

  return (
    <div className="students-table">
      <table>
        <thead>
          <tr>
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
              <tr key={student.id}>
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
              <td colSpan="11" className="no-data">
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;