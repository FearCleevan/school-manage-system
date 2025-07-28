//src/components/accountsettings/components/UsersTable.jsx
import React from 'react';
import { FaEye, FaUserEdit, FaTrash, FaQuestionCircle } from 'react-icons/fa';
import {
  FaHome, FaGraduationCap, FaBuilding, FaBook,
  FaClipboardList, FaMoneyBillWave, FaChartLine,
  FaCalendarCheck, FaBell, FaShieldAlt, FaCog
} from 'react-icons/fa';
import '../accountUserSettings.css';

const permissionIcons = {
  dashboard: <FaHome />,
  manageStudent: <FaGraduationCap />,
  department: <FaBuilding />,
  course: <FaBook />,
  subjects: <FaClipboardList />,
  payment: <FaMoneyBillWave />,
  gradingSystem: <FaChartLine />,
  attendance: <FaCalendarCheck />,
  announcement: <FaBell />,
  accountPermission: <FaShieldAlt />,
  accountSettings: <FaCog />,
};

const permissionLabels = {
  dashboard: "Dashboard",
  manageStudent: "Student Management",
  department: "Department",
  course: "Course",
  subjects: "Subjects",
  payment: "Payment Management",
  gradingSystem: "Grading System",
  attendance: "Attendance",
  announcement: "Announcement",
  accountPermission: "Account Permission",
  accountSettings: "Account & User Settings"
};

const UsersTable = ({
  users,
  currentUser,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onStatusChange
}) => {
  return (
    <div className="users-table">
      <table>
        <thead>
          <tr>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <img
                  src={user.photoURL || '/default-profile.png'}
                  alt="Profile"
                  className="profile-image"
                />
              </td>
              <td>{user.firstName} {user.middleName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <select
                  value={user.status || 'active'}
                  onChange={(e) => onStatusChange(user.id, e.target.value)}
                  className="status-select"
                  disabled={!currentUser || currentUser.role !== 'admin'}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </td>
              <td>
                <div className="permission-icons-container">
                  {user.permissions?.reduce((rows, permission, index) => {
                    const chunkIndex = Math.floor(index / 6);
                    if (!rows[chunkIndex]) rows[chunkIndex] = [];
                    rows[chunkIndex].push(permission);
                    return rows;
                  }, []).map((row, rowIndex) => (
                    <div key={rowIndex} className="permission-icons-row">
                      {row.map(permission => (
                        <div
                          key={permission}
                          className="permission-icon"
                          title={permissionLabels[permission] || permission}
                        >
                          {permissionIcons[permission] || <FaQuestionCircle />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => onViewUser(user)}
                    className="view-btn"
                    title="View User"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => onEditUser(user)}
                    className="edit-btn"
                    title="Edit User"
                  >
                    <FaUserEdit />
                  </button>
                  <button
                    onClick={() => onDeleteUser(user)}
                    className="delete-btn"
                    title="Delete User"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;