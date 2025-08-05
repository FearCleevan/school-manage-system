import React from 'react';
import { FaEye, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import '../subjects.css';

const SubjectsTable = ({
  subjects,
  loading,
  sortConfig,
  requestSort,
  onViewSubject,
  onEditSubject,
  onDeleteSubject
}) => {
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading) {
    return <div className="loading-indicator">Loading subjects...</div>;
  }

  return (
    <div className="subjects-table">
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort("subjectId")}>
              <span className="sortable-header">
                Subject ID {renderSortIcon("subjectId")}
              </span>
            </th>
            <th onClick={() => requestSort("subjectName")}>
              <span className="sortable-header">
                Subject Name {renderSortIcon("subjectName")}
              </span>
            </th>
            <th onClick={() => requestSort("course")}>
              <span className="sortable-header">
                Course {renderSortIcon("course")}
              </span>
            </th>
            <th onClick={() => requestSort("yearLevel")}>
              <span className="sortable-header">
                Year Level {renderSortIcon("yearLevel")}
              </span>
            </th>
            <th onClick={() => requestSort("semester")}>
              <span className="sortable-header">
                Semester {renderSortIcon("semester")}
              </span>
            </th>
            <th onClick={() => requestSort("status")}>
              <span className="sortable-header">
                Status {renderSortIcon("status")}
              </span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.length > 0 ? (
            subjects.map((subject) => (
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
                      className="action-btn view-btn"
                      data-tooltip="View details"
                      onClick={() => onViewSubject(subject)}
                      aria-label="View subject details"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      data-tooltip="Edit subject"
                      onClick={() => onEditSubject(subject)}
                      aria-label="Edit subject"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      data-tooltip="Delete subject"
                      onClick={() => onDeleteSubject(subject)}
                      aria-label="Delete subject"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-data">
                No subjects found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectsTable;