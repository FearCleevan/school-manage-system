// src/components/manageStudent/components/TableControls.jsx
import React from 'react';
import {
  FaSearch,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaUserPlus,
  FaFilter
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import '../studentManagement.css';

const TableControls = ({
  departmentTab,
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  setItemsPerPage,
  courseFilter,
  setCourseFilter,
  yearLevelFilter,
  setYearLevelFilter,
  semesterFilter,
  setSemesterFilter,
  availableCourses,
  availableYearLevels,
  availableSemesters,
  resetFilters,
  onNewEnroll,
  onExistingEnroll,
  onExportExcel,
  onExportPDF,
  onPrint,
  prepareExportData,
  onImportClick,
  hasFilters,
  selectedRows = []
}) => {
  const handleExportExcelClick = () => {
    if (selectedRows.length > 0) {
      if (window.confirm(`Export ${selectedRows.length} selected students to Excel?`)) {
        onExportExcel(selectedRows);
      }
    } else {
      onExportExcel(); // Export current view (filtered and paginated)
    }
  };

  const handleCSVExport = () => {
    if (selectedRows.length > 0) {
      const selectedData = prepareExportData().filter(item => 
        selectedRows.includes(item['Student ID'])
      );
      return selectedData;
    }
    return prepareExportData(); // Return current view data
  };

  return (
    <div className="table-controls">
      <div className="left-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-dropdown">
            <label>Course:</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
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
              value={yearLevelFilter}
              onChange={(e) => setYearLevelFilter(e.target.value)}
            >
              <option value="">All Year Levels</option>
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
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">All Semesters</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
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

        <div className="enroll-buttons">
          <button
            className="enroll-btn primary"
            onClick={onNewEnroll}
          >
            <FaUserPlus /> Enroll New Student
          </button>
          <button
            className="enroll-btn secondary"
            onClick={onExistingEnroll}
          >
            <FaUserPlus /> Enroll Existing Student
          </button>
        </div>
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
          <button 
            className="export-btn" 
            onClick={handleExportExcelClick}
            title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected` : 'Export current view'}
          >
            <FaFileExcel /> Excel
            {selectedRows.length > 0 && (
              <span className="selection-count">{selectedRows.length}</span>
            )}
          </button>
          
          <button 
            className="export-btn" 
            onClick={() => selectedRows.length > 0 ? 
              onExportPDF(selectedRows) : 
              onExportPDF()
            }
            title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected` : 'Export current view'}
          >
            <FaFilePdf /> PDF
            {selectedRows.length > 0 && (
              <span className="selection-count">{selectedRows.length}</span>
            )}
          </button>
          
          <CSVLink
            data={handleCSVExport()}
            filename={`students_${departmentTab}_${new Date().toISOString().slice(0, 10)}.csv`}
            className="export-btn"
            title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected` : 'Export current view'}
          >
            <FaFileExcel /> CSV
            {selectedRows.length > 0 && (
              <span className="selection-count">{selectedRows.length}</span>
            )}
          </CSVLink>
          
          <button 
            className="export-btn" 
            onClick={onPrint}
            title="Print current view"
          >
            <FaPrint /> Print
          </button>
          
          <button
            className="export-btn"
            onClick={onImportClick}
            title="Import students"
          >
            <FaFileExcel /> Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableControls;