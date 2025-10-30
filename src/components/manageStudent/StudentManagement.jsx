// src/components/manageStudent/StudentManagement.jsx
import React, { useState } from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CSVLink } from 'react-csv';
import { db } from '../../lib/firebase/config';
import { auth } from '../../lib/firebase/config';  // Adjust path as needed
import { logActivity } from '../../lib/firebase/activityLogger';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';

import './studentManagement.css';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ImportModal from './components/ImportModal';
import StudentTable from './components/StudentTable';
import TableControls from './components/TableControls';
import { useStudentData } from './hooks/useStudentData';
import { useStudentFilters } from './hooks/useStudentFilters';
import { useStudentExports } from './hooks/useStudentExports';
import { departmentOptions, fieldMap } from './utils/departmentOptions';
import { formatFullName, formatAddress, getDepartmentLabel } from './utils/studentFormatters';
import EnrollModal from '../modals/EnrollStudent/EnrollModal';
import EditStudent from '../modals/EditStudents.jsx/EditStudent';
import ExistingStudentEnrollment from '../modals/EnrolledExistingStudent/ExistingStudentEnrollment';
import ViewStudentDetails from '../modals/ViewStudent/ViewStudentDetails';

const StudentManagement = () => {
  const [departmentTab, setDepartmentTab] = useState("college");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
    firestoreField: "createdAt",
  });

  // Modals state
  const [showNewEnrollModal, setShowNewEnrollModal] = useState(false);
  const [showExistingEnrollModal, setShowExistingEnrollModal] = useState(false);
  const [viewStudentId, setViewStudentId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");

  // Custom hooks
  const { students, loading, error, setStudents } = useStudentData(departmentTab, sortConfig, fieldMap);
  const {
    searchTerm,
    setSearchTerm,
    courseFilter,
    setCourseFilter,
    yearLevelFilter,
    setYearLevelFilter,
    semesterFilter,
    setSemesterFilter,
    availableCourses,
    availableYearLevels,
    availableSemesters,
    resetFilters
  } = useStudentFilters(departmentTab, departmentOptions);

  const { exportToExcel, exportToPDF } = useStudentExports();

  // Define all columns and their visibility
  const [visibleColumns, setVisibleColumns] = useState([
    'selection', 'studentId', 'profile', 'name', 'address', 'phone',
    'course', 'year', 'semester', 'department', 'status', 'actions'
  ]);

  const allColumns = [
    { key: 'selection', label: 'Selection Checkbox' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'profile', label: 'Profile' },
    { key: 'name', label: 'Full Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'course', label: 'Course' },
    { key: 'year', label: 'Year' },
    { key: 'semester', label: 'Semester' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  // Filter students
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();

    // Safely handle all string conversions with proper null checks
    const studentId = student.studentId?.toLowerCase() || '';
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const email = student.email?.toLowerCase() || '';
    const street = student.address?.street?.toLowerCase() || '';
    const phone = String(student.phone || '').toLowerCase(); // Convert to string first

    const matchesSearch =
      studentId.includes(searchLower) ||
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      street.includes(searchLower) ||
      phone.includes(searchLower);

    const matchesEnrollment =
      (!courseFilter || student.enrollment?.course === courseFilter) &&
      (!yearLevelFilter || student.enrollment?.yearLevel === yearLevelFilter) &&
      (!semesterFilter || student.enrollment?.semester === semesterFilter);

    return matchesSearch && matchesEnrollment;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Sort function
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({
      key,
      direction,
      firestoreField: fieldMap[key] || null,
    });
    setCurrentPage(1);
  };

  // Handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportModalOpen(true);
  };

  // Process import
  // Process import
  const processImport = async () => {
    if (!importFile) return;

    setImportStatus("Reading file...");
    setImportProgress(10);
    toast.info("Starting student imports...");

    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setImportStatus("Validating data...");
      setImportProgress(30);

      const studentsByDepartment = {
        college: [],
        tvet: [],
        shs: [],
        jhs: [],
      };

      jsonData.forEach((row, index) => {
        const student = {
          studentId: row["Student ID"] || `TEMP-${Date.now()}-${index}`,
          department: row["Department"]?.toLowerCase() || departmentTab,
          lrn: row["LRN"] || null,
          firstName: row["First Name"] || "",
          middleName: row["Middle Name"] || null,
          lastName: row["Last Name"] || "",
          email: row["Email"] || "",
          phone: row["Phone"] || "",
          username: row["Username"] || "",
          password: row["Password"] || "defaultPassword123",
          address: {
            street: row["Address"] || "",
            province: row["Province"] || "",
            city: row["City"] || "",
            zipCode: row["ZIP Code"] || "",
          },
          emergencyContact: {
            name: row["Emergency Name"] || "",
            phone: row["Emergency Contact"] || "",
            relation: row["Emergency Relation"] || "guardian",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "active",
          isVerified: false,
          academicStatus: "not enrolled",
          enrollment: {
            course: "Not Enrolled",
            yearLevel: "Not Enrolled",
            semester: "Not Enrolled",
            schoolYear: "Not Enrolled",
          },
        };

        const validDepartments = ["college", "tvet", "shs", "jhs"];
        if (!validDepartments.includes(student.department)) {
          throw new Error(`Invalid department '${student.department}' in row ${index + 2}`);
        }

        studentsByDepartment[student.department].push(student);
      });

      setImportStatus("Uploading students...");
      setImportProgress(60);

      const batch = writeBatch(db);
      const studentsRef = collection(db, "students");

      // FIXED: Only get the students array, ignore the department key
      Object.values(studentsByDepartment).forEach((studentsArray) => {
        studentsArray.forEach((student) => {
          const docRef = doc(studentsRef);
          batch.set(docRef, student);
        });
      });

      await batch.commit();

      setImportStatus("Successfully imported!");
      setImportProgress(100);
      toast.success("Students imported successfully!");

      // Refresh current department's student list
      const q = query(studentsRef, where("department", "==", departmentTab));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);

      setTimeout(() => {
        setImportModalOpen(false);
        setImportFile(null);
        setImportProgress(0);
        setImportStatus("");
      }, 2000);
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus(`Error: ${error.message}`);
      setImportProgress(0);
      toast.error(`Import failed: ${error.message}`);
    }
  };

  // Bulk action handlers
  const handlePrintSelected = (selectedIds) => {
    const selectedStudents = students.filter(student => selectedIds.includes(student.id));
    const printData = prepareExportData(selectedStudents);
    exportToPDF(printData, departmentTab, {
      courseFilter,
      yearLevelFilter,
      semesterFilter,
      searchTerm
    }, true);
  };

  const handleExportExcelSelected = (selectedIds) => {
    const selectedStudents = students.filter(student => selectedIds.includes(student.id));
    const exportData = prepareExportData(selectedStudents);
    exportToExcel(exportData, departmentTab);
  };

  const handleExportPDFSelected = (selectedIds) => {
    const selectedStudents = students.filter(student => selectedIds.includes(student.id));
    const exportData = prepareExportData(selectedStudents);
    exportToPDF(exportData, departmentTab, {
      courseFilter,
      yearLevelFilter,
      semesterFilter,
      searchTerm
    }, true);
  };

  const handleDeleteSelected = (selectedIds) => {
    setStudentToDelete(selectedIds);
    setDeleteModalOpen(true);
  };
  // Delete functions
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);  // Make sure this is the full student object
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      const batch = writeBatch(db);
      const idsToDelete = Array.isArray(studentToDelete) ? studentToDelete : [studentToDelete.id];
      const studentsToDelete = students.filter(student => idsToDelete.includes(student.id));

      // Delete all selected students in batch
      idsToDelete.forEach(id => {
        const docRef = doc(db, "students", id);
        batch.delete(docRef);
      });

      await batch.commit();

      // Log activity for each deleted student
      studentsToDelete.forEach(student => {
        logActivity('deleted a student', {
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`
        }, auth.currentUser.displayName);
      });

      // If bulk delete, also log a summary activity
      if (idsToDelete.length > 1) {
        logActivity('deleted multiple students', {
          count: idsToDelete.length,
          studentIds: studentsToDelete.map(s => s.studentId),
          department: departmentTab
        }, auth.currentUser.displayName);
      }

      setStudents(students.filter(student => !idsToDelete.includes(student.id)));
      setDeleteModalOpen(false);
      setStudentToDelete(null);

      const message = idsToDelete.length > 1
        ? `${idsToDelete.length} students deleted successfully!`
        : "Student deleted successfully!";
      toast.success(message);
    } catch (error) {
      console.error("Error deleting student(s):", error);
      toast.error("Failed to delete student(s)!");
    }
  };


  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  // Handle update student
  const handleUpdateStudent = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === updatedStudent.id ? { ...student, ...updatedStudent } : student
      )
    );
    toast.success("Student updated successfully!");
    logActivity('edited a student', {
      studentId: updatedStudent.studentId,
      changes: updatedStudent
    }, auth.currentUser.displayName);
  };

  // Prepare data for export (matching import structure)
  const prepareExportData = (studentsToExport = null) => {
    // Use provided students array, filtered students, or current page items
    const dataToExport = studentsToExport || filteredStudents;

    return dataToExport.map((student) => ({
      "Student ID": student.studentId || "",
      "Department": getDepartmentLabel(student.department) || "",
      "LRN": student.lrn || "",
      "First Name": student.firstName || "",
      "Middle Name": student.middleName || "",
      "Last Name": student.lastName || "",
      "Email": student.email || "",
      "Phone": String(student.phone || ""), // Convert to string
      "Username": student.username || "",
      "Password": student.password || "Fear@123",
      "Address": student.address?.street || "",
      "Province": student.address?.province || "",
      "City": student.address?.city || "",
      "ZIP Code": student.address?.zipCode || "",
      "Emergency Name": student.emergencyContact?.name || "",
      "Emergency Contact": String(student.emergencyContact?.phone || ""), // Convert to string
      "Emergency Relation": student.emergencyContact?.relation || "guardian",
      "Status": student.status || "",
      "Course": student.enrollment?.course || "Not Enrolled",
      "Year Level": student.enrollment?.yearLevel || "Not Enrolled",
      "Semester": student.enrollment?.semester || "Not Enrolled",
      "School Year": student.enrollment?.schoolYear || "Not Enrolled",
      "Created At": student.createdAt?.toDate?.()?.toLocaleString() || "",
      "Updated At": student.updatedAt?.toDate?.()?.toLocaleString() || ""
    }));
  };

  // Handle exports
  const handleExportExcel = (selectedIds = null) => {
    if (selectedIds) {
      // Export selected rows
      const selectedStudents = students.filter(student => selectedIds.includes(student.id));
      const exportData = prepareExportData(selectedStudents);
      exportToExcel(exportData, departmentTab);
    } else {
      // Export current page
      const exportData = prepareExportData(currentItems);
      exportToExcel(exportData, departmentTab);
    }
  };

  const handleExportPDF = () => {
    exportToPDF(prepareExportData(), departmentTab, {
      courseFilter,
      yearLevelFilter,
      semesterFilter,
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
          <title>Student List - ${getDepartmentLabel(departmentTab)}</title>
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
          <h1>Student List - ${getDepartmentLabel(departmentTab)}</h1>
          <div class="print-info">
            Generated on: ${new Date().toLocaleString()}<br>
            ${filteredStudents.length} records found<br>
            ${courseFilter ? `Course: ${courseFilter}<br>` : ""}
            ${yearLevelFilter ? `Year Level: ${yearLevelFilter}<br>` : ""}
            ${semesterFilter ? `Semester: ${semesterFilter}<br>` : ""}
            ${searchTerm ? `Search Term: "${searchTerm}"<br>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((student) => `
                <tr>
                  <td>${student.studentId}</td>
                  <td>${student.lastName}, ${student.firstName}</td>
                  <td>${student.phone}</td>
                  <td>${student.enrollment.course}</td>
                  <td>${student.enrollment.yearLevel}</td>
                  <td>${student.enrollment.semester}</td>
                  <td class="status-${student.status.toLowerCase()}">${student.status}</td>
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
    <div className="student-management-container">
      <div className="student-management">
        <h2 className="management-header">
          <FaGraduationCap /> Student Management
        </h2>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            {error.includes("index") && (
              <>
                <p>This query requires a Firestore index.</p>
                <a
                  href="https://console.firebase.google.com/v1/r/project/school-system-4cf7a/firestore/indexes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="index-link"
                >
                  Click here to create the required index
                </a>
              </>
            )}
          </div>
        )}

        {/* Department Tabs */}
        <div className="department-tabs">
          {["college", "tvet", "shs", "jhs"].map((dept) => (
            <button
              key={dept}
              className={`dept-tab ${departmentTab === dept ? "active" : ""}`}
              onClick={() => {
                setDepartmentTab(dept);
                setCurrentPage(1);
              }}
            >
              {getDepartmentLabel(dept)}
            </button>
          ))}
        </div>

        {/* Table Controls */}
        <TableControls
          departmentTab={departmentTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          courseFilter={courseFilter}
          setCourseFilter={setCourseFilter}
          yearLevelFilter={yearLevelFilter}
          setYearLevelFilter={setYearLevelFilter}
          semesterFilter={semesterFilter}
          setSemesterFilter={setSemesterFilter}
          availableCourses={availableCourses}
          availableYearLevels={availableYearLevels}
          availableSemesters={availableSemesters}
          resetFilters={resetFilters}
          onNewEnroll={() => setShowNewEnrollModal(true)}
          onExistingEnroll={() => setShowExistingEnrollModal(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onPrint={printTable}
          prepareExportData={prepareExportData}
          onImportClick={() => document.getElementById("import-file").click()}
          hasFilters={!!(courseFilter || yearLevelFilter || semesterFilter || searchTerm)}
          columns={allColumns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />

        <input
          type="file"
          id="import-file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleFileImport}
        />

        {/* Students Table */}
        <StudentTable
          students={currentItems}
          loading={loading}
          sortConfig={sortConfig}
          requestSort={requestSort}
          formatFullName={formatFullName}
          formatAddress={formatAddress}
          getDepartmentLabel={getDepartmentLabel}
          onViewStudent={(student) => setViewStudentId(student.id)}
          onEditStudent={(student) => {
            setEditingStudent(student);
            setShowEditModal(true);
          }}
          onDeleteStudent={handleDeleteClick}
          onPrintSelected={handlePrintSelected}
          onExportExcelSelected={handleExportExcelSelected}
          onExportPDFSelected={handleExportPDFSelected}
          onDeleteSelected={handleDeleteSelected}
          visibleColumns={visibleColumns}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredStudents.length)} of{" "}
              {filteredStudents.length} entries
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
          student={Array.isArray(studentToDelete) ? null : studentToDelete}
          isBulkDelete={Array.isArray(studentToDelete)}
          students={Array.isArray(studentToDelete)
            ? students.filter(student => studentToDelete.includes(student.id))
            : []}
        />

        <ImportModal
          isOpen={importModalOpen}
          fileName={importFile?.name}
          progress={importProgress}
          status={importStatus}
          onCancel={() => {
            setImportModalOpen(false);
            setImportFile(null);
            setImportProgress(0);
            setImportStatus("");
          }}
          onImport={processImport}
        />

        {/* Enrollment and Edit Modals */}
        <EnrollModal
          show={showNewEnrollModal}
          onClose={() => setShowNewEnrollModal(false)}
        />

        <ExistingStudentEnrollment
          show={showExistingEnrollModal}
          onClose={() => setShowExistingEnrollModal(false)}
        />

        <EditStudent
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          student={editingStudent}
          onUpdate={handleUpdateStudent}
        />

        {viewStudentId && (
          <ViewStudentDetails
            studentId={viewStudentId}
            onClose={() => setViewStudentId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default StudentManagement;