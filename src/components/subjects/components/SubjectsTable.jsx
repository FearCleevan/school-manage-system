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
              Subject ID {renderSortIcon("subjectId")}
            </th>
            <th onClick={() => requestSort("subjectName")}>
              Subject Name {renderSortIcon("subjectName")}
            </th>
            <th onClick={() => requestSort("course")}>
              Course {renderSortIcon("course")}
            </th>
            <th onClick={() => requestSort("yearLevel")}>
              Year Level {renderSortIcon("yearLevel")}
            </th>
            <th onClick={() => requestSort("semester")}>
              Semester {renderSortIcon("semester")}
            </th>
            <th onClick={() => requestSort("status")}>
              Status {renderSortIcon("status")}
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
                      className="view-btn"
                      title="View"
                      onClick={() => onViewSubject(subject)}
                    >
                      <FaEye />
                    </button>
                    <button
                      className="edit-btn"
                      title="Edit"
                      onClick={() => onEditSubject(subject)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn"
                      title="Delete"
                      onClick={() => onDeleteSubject(subject)}
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