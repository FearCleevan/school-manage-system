import React from 'react';
import { FaSearch, FaFileExcel, FaFilePdf, FaPrint, FaPlus, FaFilter } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import '../subjects.css';

const TableControls = ({
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  setItemsPerPage,
  filters,
  handleFilterChange,
  availableCourses,
  availableYearLevels,
  availableSemesters,
  availableStatuses,
  resetFilters,
  onAddSubject,
  onExportExcel,
  onExportPDF,
  onPrint,
  prepareExportData,
  hasFilters
}) => {
  return (
    <div className="table-controls">
      <div className="left-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-dropdown">
            <label>Course:</label>
            <select
              value={filters.course}
              onChange={(e) => handleFilterChange('course', e.target.value)}
            >
              {availableCourses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown">
            <label>Year Level:</label>
            <select
              value={filters.yearLevel}
              onChange={(e) => handleFilterChange('yearLevel', e.target.value)}
            >
              {availableYearLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown">
            <label>Semester:</label>
            <select
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            className="reset-filters-btn"
            onClick={resetFilters}
            disabled={!hasFilters}
          >
            <FaFilter /> Reset Filters
          </button>
        </div>

        <button
          className="add-btn"
          onClick={onAddSubject}
        >
          <FaPlus /> Add Subject
        </button>
      </div>

      <div className="right-controls">
        <div className="items-per-page">
          <span>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="export-buttons">
          <button className="export-btn" onClick={onExportExcel}>
            <FaFileExcel /> Excel
          </button>
          <button className="export-btn" onClick={onExportPDF}>
            <FaFilePdf /> PDF
          </button>
          <CSVLink
            data={prepareExportData()}
            filename="subjects-list.csv"
            className="export-btn"
          >
            <FaFileExcel /> CSV
          </CSVLink>
          <button className="export-btn" onClick={onPrint}>
            <FaPrint /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableControls;