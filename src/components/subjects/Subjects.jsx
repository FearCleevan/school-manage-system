// src/components/subjects/Subjects.jsx
import React, { useState } from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CSVLink } from 'react-csv';
import { db } from '../../lib/firebase/config';
import { collection, doc, deleteDoc, getDocs } from 'firebase/firestore';

import './subjects.css';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import SubjectsTable from './components/SubjectsTable';
import TableControls from './components/TableControls';
import { useSubjectsData } from './hooks/useSubjectsData';
import { useSubjectsFilters } from './hooks/useSubjectsFilters';
import { useSubjectsExports } from './hooks/useSubjectsExports';
import AddSubject from '../modals/AddSubject';
import ViewSubject from '../modals/ViewSubject';
import EditSubject from '../modals/EditSubject';

const Subjects = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "subjectId",
    direction: "asc",
  });
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingSubject, setViewingSubject] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Custom hooks
  const { subjects, loading, error, setSubjects } = useSubjectsData();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    availableCourses,
    availableYearLevels,
    availableSemesters,
    availableStatuses,
    resetFilters
  } = useSubjectsFilters();
  
  const { exportToExcel, exportToPDF } = useSubjectsExports();

  // Sort function
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Get sorted data
  const getSortedData = () => {
    const sortableItems = [...subjects];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
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

  // Handle add subject
  const handleAddSubject = (newSubject) => {
    setSubjects(prev => [...prev, newSubject]);
    toast.success('Subject added successfully!');
  };

  // Handle update subject
  const handleUpdateSubject = (updatedSubject) => {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === updatedSubject.id ? updatedSubject : subject
      )
    );
    toast.success('Subject updated successfully!');
  };

  // Delete functions
  const handleDeleteClick = (subject) => {
    setSubjectToDelete(subject);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      await deleteDoc(doc(db, 'subjects', subjectToDelete.id));
      setSubjects(subjects.filter(subject => subject.id !== subjectToDelete.id));
      setDeleteModalOpen(false);
      setSubjectToDelete(null);
      toast.success('Subject deleted successfully!');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject!');
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSubjectToDelete(null);
  };

  // Prepare data for export
  const prepareExportData = () => {
    return filteredSubjects.map(subject => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      course: subject.course,
      yearLevel: subject.yearLevel,
      semester: subject.semester,
      status: subject.status,
      description: subject.description || '',
      units: subject.units || '',
      prerequisites: subject.prerequisites?.join(', ') || '',
    }));
  };

  // Handle exports
  const handleExportExcel = () => {
    exportToExcel(prepareExportData());
  };

  const handleExportPDF = () => {
    exportToPDF(prepareExportData(), {
      courseFilter: filters.course,
      yearLevelFilter: filters.yearLevel,
      semesterFilter: filters.semester,
      searchTerm
    });
  };

  // Print function
  const printTable = () => {
    const printWindow = window.open("", "_blank");
    const data = prepareExportData();

    const html = `
      <html>
        <head>
          <title>Subjects List</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #333; }
            .print-info { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-active { color: green; }
            .status-inactive { color: red; }
          </style>
        </head>
        <body>
          <h1>Subjects List</h1>
          <div class="print-info">
            Generated on: ${new Date().toLocaleString()}<br>
            ${filteredSubjects.length} records found<br>
            ${filters.course !== 'All' ? `Course: ${filters.course}<br>` : ""}
            ${filters.yearLevel !== 'All' ? `Year Level: ${filters.yearLevel}<br>` : ""}
            ${filters.semester !== 'All' ? `Semester: ${filters.semester}<br>` : ""}
            ${searchTerm ? `Search Term: "${searchTerm}"<br>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Year Level</th>
                <th>Semester</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(subject => `
                <tr>
                  <td>${subject.subjectId}</td>
                  <td>${subject.subjectName}</td>
                  <td>${subject.course}</td>
                  <td>${subject.yearLevel}</td>
                  <td>${subject.semester}</td>
                  <td class="status-${subject.status.toLowerCase()}">${subject.status}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="subjects-container">
      <div className="subjects-management">
        <h2 className="management-header">
          <FaGraduationCap /> Subjects Management
        </h2>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Table Controls */}
        <TableControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          filters={filters}
          handleFilterChange={handleFilterChange}
          availableCourses={availableCourses}
          availableYearLevels={availableYearLevels}
          availableSemesters={availableSemesters}
          availableStatuses={availableStatuses}
          resetFilters={resetFilters}
          onAddSubject={() => setShowAddModal(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onPrint={printTable}
          prepareExportData={prepareExportData}
          hasFilters={
            filters.course !== 'All' || 
            filters.yearLevel !== 'All' || 
            filters.semester !== 'All' || 
            filters.status !== 'All' || 
            searchTerm
          }
        />

        {/* Subjects Table */}
        <SubjectsTable
          subjects={currentItems}
          loading={loading}
          sortConfig={sortConfig}
          requestSort={requestSort}
          onViewSubject={(subject) => setViewingSubject(subject)}
          onEditSubject={(subject) => {
            setEditingSubject(subject);
            setShowEditModal(true);
          }}
          onDeleteSubject={handleDeleteClick}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredSubjects.length)} of{" "}
              {filteredSubjects.length} entries
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
                    className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
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

        {/* Modals */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          subject={subjectToDelete}
        />

        <AddSubject
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddSubject={handleAddSubject}
        />

        <ViewSubject
          show={viewingSubject !== null}
          onClose={() => setViewingSubject(null)}
          subject={viewingSubject}
        />

        <EditSubject
          show={editingSubject !== null}
          onClose={() => setEditingSubject(null)}
          subject={editingSubject}
          onUpdateSubject={handleUpdateSubject}
        />
      </div>
    </div>
  );
};

export default Subjects;