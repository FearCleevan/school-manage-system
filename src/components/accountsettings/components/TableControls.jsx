//src/components/accountsettings/components/TableControls.jsx
import React from 'react';
import { FaSearch, FaUserPlus, FaFileExport } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import '../accountUserSettings.css';

const TableControls = ({
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  setItemsPerPage,
  onAddUser,
  users
}) => {
  return (
    <div className="table-controls">
      <div className="left-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="create-btn"
          onClick={onAddUser}
        >
          <FaUserPlus /> Create New User
        </button>
      </div>

      <div className="right-controls">
        <div className="items-per-page">
          <span>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            {[5, 10, 20, 50, 100].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="export-button">
          <CSVLink
            data={users.map(user => ({
              ...user,
              permissions: user.permissions?.join(', ') || ''
            }))}
            headers={[
              { label: "ID", key: "id" },
              { label: "First Name", key: "firstName" },
              { label: "Last Name", key: "lastName" },
              { label: "Email", key: "email" },
              { label: "Role", key: "role" },
              { label: "Status", key: "status" },
              { label: "Permissions", key: "permissions" }
            ]}
            filename="users-export.csv"
            className="export-btn"
          >
            <FaFileExport />
            <span>Export</span>
          </CSVLink>
        </div>
      </div>
    </div>
  );
};

export default TableControls;