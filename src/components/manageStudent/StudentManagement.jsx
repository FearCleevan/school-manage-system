import React, { useState, useEffect } from "react";
import {
  FaGraduationCap,
  FaSearch,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUserPlus,
  FaFilter,
} from "react-icons/fa";
import { CSVLink } from "react-csv";
import { db } from "../../lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  doc,
  deleteDoc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import EnrollModal from "../modals/EnrollModal";
import EditStudent from "../modals/EditStudent";
import ExistingStudentEnrollment from "../modals/ExistingStudentEnrollment";
import "./StudentManagement.css";
import ViewStudentDetails from "../modals/ViewStudentDetails";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { jsPDF } from "jspdf";
import "jspdf-autotable";

const StudentManagement = () => {
  // State management
  const [showNewEnrollModal, setShowNewEnrollModal] = useState(false);
  const [showExistingEnrollModal, setShowExistingEnrollModal] = useState(false);
  const [departmentTab, setDepartmentTab] = useState("college");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
    firestoreField: "createdAt",
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewStudentId, setViewStudentId] = useState(null);

  // Filter states
  const [courseFilter, setCourseFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableYearLevels, setAvailableYearLevels] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  // Imports
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");

  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add this modal component near your other modal components
  const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, student }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Confirm Deletion</h3>
          <p>
            Are you sure you want to delete {student?.firstName}{" "}
            {student?.lastName}?
            <br />
            Student ID: {student?.studentId}
          </p>
          <div className="modal-actions">
            <button className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleUpdateStudent = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === updatedStudent.id
          ? { ...student, ...updatedStudent }
          : student
      )
    );
    toast.success("Student updated successfully!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const processImport = async () => {
    if (!importFile) return;

    setImportStatus("Reading file...");
    setImportProgress(10);
    toast.info("Starting student import...", {
      position: "top-right",
      autoClose: 2000,
    });

    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setImportStatus("Validating data...");
      setImportProgress(30);

      // Group students by department
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

        // Validate department
        const validDepartments = ["college", "tvet", "shs", "jhs"];
        if (!validDepartments.includes(student.department)) {
          throw new Error(
            `Invalid department '${student.department}' in row ${index + 2}`
          );
        }

        studentsByDepartment[student.department].push(student);
      });

      setImportStatus("Uploading students...");
      setImportProgress(60);

      // Upload to Firestore by department
      const batch = writeBatch(db);
      const studentsRef = collection(db, "students");

      Object.entries(studentsByDepartment).forEach(([dept, deptStudents]) => {
        deptStudents.forEach((student) => {
          const docRef = doc(studentsRef);
          batch.set(docRef, student);
        });
      });

      await batch.commit();

      setImportStatus("Successfully imported!");
      setImportProgress(100);
      toast.success("Students imported successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

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
      toast.error(`Import failed: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  // handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportModalOpen(true);
  };

  // Department options
  const departmentOptions = {
    college: {
      courses: ["BSIT", "BSHM", "BSBA", "BSTM"],
      yearLevels: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      semesters: ["1st Semester", "2nd Semester", "Summer"],
    },
    tvet: {
      courses: ["BTVTeD-AT", "BTVTeD-HVACR TECH", "BTVTeD-FSM", "BTVTeD-ET"],
      yearLevels: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      semesters: ["1st Semester", "2nd Semester", "Summer"],
    },
    shs: {
      courses: ["SHS"],
      yearLevels: ["Grade 11", "Grade 12"],
      semesters: ["1st Semester", "2nd Semester"],
    },
    jhs: {
      courses: ["JHS"],
      yearLevels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
      semesters: ["1st Semester", "2nd Semester"],
    },
  };

  const fieldMap = {
    studentId: "studentId",
    lastName: "lastName",
    phone: "phone",
    department: "department",
    status: "status",
    createdAt: "createdAt",
    "enrollment.course": "enrollment.course",
    "enrollment.yearLevel": "enrollment.yearLevel",
    "enrollment.semester": "enrollment.semester",
  };

  // Update available filters when department changes
  useEffect(() => {
    const departmentData = departmentOptions[departmentTab] || {};
    setAvailableCourses(departmentData.courses || []);
    setAvailableYearLevels(departmentData.yearLevels || []);
    setAvailableSemesters(departmentData.semesters || []);

    // Reset filters when department changes
    setCourseFilter("");
    setYearLevelFilter("");
    setSemesterFilter("");
    setCurrentPage(1);
  }, [departmentTab]);

  // Export to Excel
  const exportToExcel = () => {
    toast.info("Preparing Excel export...", {
      position: "top-right",
      autoClose: 2000,
    });
    setTimeout(() => {
      const worksheet = XLSX.utils.json_to_sheet(prepareExportData());
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(
        workbook,
        `students_${departmentTab}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Excel export completed!", {
        position: "top-right",
        autoClose: 3000,
      });
    }, 500);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const data = prepareExportData();

    // Add title
    doc.text(`Student List - ${getDepartmentLabel(departmentTab)}`, 14, 15);

    // Add filters info if any
    let filtersInfo = [];
    if (courseFilter) filtersInfo.push(`Course: ${courseFilter}`);
    if (yearLevelFilter) filtersInfo.push(`Year Level: ${yearLevelFilter}`);
    if (semesterFilter) filtersInfo.push(`Semester: ${semesterFilter}`);
    if (searchTerm) filtersInfo.push(`Search: "${searchTerm}"`);

    if (filtersInfo.length > 0) {
      doc.text(`Filters: ${filtersInfo.join(", ")}`, 14, 25);
    }

    // Prepare table data
    const tableData = data.map((student) => [
      student.studentId,
      `${student.lastName}, ${student.firstName}`,
      student.phone,
      student.enrollment.course,
      student.enrollment.yearLevel,
      student.enrollment.semester,
      student.status,
    ]);

    // Add table
    doc.autoTable({
      head: [["ID", "Name", "Phone", "Course", "Year", "Semester", "Status"]],
      body: tableData,
      startY: filtersInfo.length > 0 ? 30 : 20,
      margin: { top: 20 },
    });

    doc.save(
      `students_${departmentTab}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  // Prepare data for export (common for all formats)
  const prepareExportData = () => {
    return filteredStudents.map((student) => ({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName || "",
      email: student.email,
      phone: student.phone,
      address: formatAddress(student),
      department: getDepartmentLabel(student.department),
      status: student.status,
      enrollment: {
        course: student.enrollment?.course || "Not enrolled",
        yearLevel: student.enrollment?.yearLevel || "Not enrolled",
        semester: student.enrollment?.semester || "Not enrolled",
        schoolYear: student.enrollment?.schoolYear || "Not enrolled",
      },
      emergencyContact: student.emergencyContact?.name || "",
      emergencyPhone: student.emergencyContact?.phone || "",
      createdAt: student.createdAt?.toDate?.()?.toLocaleDateString() || "",
      updatedAt: student.updatedAt?.toDate?.()?.toLocaleDateString() || "",
    }));
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
                        ${data
                          .map(
                            (student) => `
                            <tr>
                                <td>${student.studentId}</td>
                                <td>${student.lastName}, ${student.firstName}</td>
                                <td>${student.phone}</td>
                                <td>${student.enrollment.course}</td>
                                <td>${student.enrollment.yearLevel}</td>
                                <td>${student.enrollment.semester}</td>
                                <td class="status-${student.status.toLowerCase()}">${student.status}</td>
                            </tr>
                        `
                          )
                          .join("")}
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

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentsRef = collection(db, "students");
        let queryConstraints = [where("department", "==", departmentTab)];

        // Add enrollment filters if selected
        if (courseFilter) {
          queryConstraints.push(where("enrollment.course", "==", courseFilter));
        }
        if (yearLevelFilter) {
          queryConstraints.push(
            where("enrollment.yearLevel", "==", yearLevelFilter)
          );
        }
        if (semesterFilter) {
          queryConstraints.push(
            where("enrollment.semester", "==", semesterFilter)
          );
        }

        // Add sorting if it's on a supported field
        if (sortConfig.key && fieldMap[sortConfig.key]) {
          queryConstraints.push(
            orderBy(fieldMap[sortConfig.key], sortConfig.direction)
          );
        }

        const q = query(studentsRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Client-side sorting for unsortable fields
        if (sortConfig.key && !fieldMap[sortConfig.key]) {
          studentsData.sort((a, b) => {
            const aValue = a[sortConfig.key] || "";
            const bValue = b[sortConfig.key] || "";
            return sortConfig.direction === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          });
        }

        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError(`Failed to load students. ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [
    departmentTab,
    courseFilter,
    yearLevelFilter,
    semesterFilter,
    sortConfig,
  ]);

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentsRef = collection(db, "students");

        // Base query with department filter
        let q = query(studentsRef, where("department", "==", departmentTab));

        // Add sorting if it's on a supported field
        if (sortConfig.key && fieldMap[sortConfig.key]) {
          q = query(q, orderBy(fieldMap[sortConfig.key], sortConfig.direction));
        }

        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Client-side sorting for unsortable fields
        if (sortConfig.key && !fieldMap[sortConfig.key]) {
          studentsData.sort((a, b) => {
            const aValue = a[sortConfig.key] || "";
            const bValue = b[sortConfig.key] || "";
            return sortConfig.direction === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          });
        }

        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError(`Failed to load students. ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [departmentTab, sortConfig]);

  // Sort function
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    // Use client-side sorting for fields without indexes
    if (!fieldMap[key]) {
      const studentsCopy = [...students];
      studentsCopy.sort((a, b) => {
        const aValue = a[key] || "";
        const bValue = b[key] || "";
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
      setStudents(studentsCopy);
    }

    setSortConfig({
      key,
      direction,
      firestoreField: fieldMap[key] || null,
    });
  };

  // Filter students (now includes both search and enrollment filters)
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      student.studentId.toLowerCase().includes(searchLower) ||
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.address?.street?.toLowerCase()?.includes(searchLower) ||
      false ||
      student.phone.toLowerCase().includes(searchLower);

    // If no enrollment filters are selected, only match search
    if (!courseFilter && !yearLevelFilter && !semesterFilter) {
      return matchesSearch;
    }

    // Check enrollment filters
    const matchesEnrollment =
      (!courseFilter || student.enrollment?.course === courseFilter) &&
      (!yearLevelFilter || student.enrollment?.yearLevel === yearLevelFilter) &&
      (!semesterFilter || student.enrollment?.semester === semesterFilter);

    return matchesSearch && matchesEnrollment;
  });

  // Reset all filters
  const resetFilters = () => {
    setCourseFilter("");
    setYearLevelFilter("");
    setSemesterFilter("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render sort icon
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  // Format full name
  const formatFullName = (student) => {
    return `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}`;
  };

  // Format address
  const formatAddress = (student) => {
    if (!student.address) return "";
    return `${student.address.street || ""}, ${student.address.city || ""}, ${student.address.province || ""} ${student.address.zipCode || ""}`;
  };

  // Get department label
  const getDepartmentLabel = (dept) => {
    const labels = {
      college: "College",
      tvet: "TVET",
      shs: "Senior High",
      jhs: "Junior High",
    };
    return labels[dept] || dept;
  };

  // Handle modal open
  // const handleOpenNewEnrollModal = () => {
  //     setShowNewEnrollModal(true);
  //     toast.info('Opening new student enrollment form', {
  //         position: "top-right",
  //         autoClose: 2000,
  //     });
  // };

  // const handleOpenExistingEnrollModal = () => {
  //     setShowExistingEnrollModal(true);
  //     toast.info('Opening existing student enrollment form', {
  //         position: "top-right",
  //         autoClose: 2000,
  //     });
  // };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Delete functions
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      await deleteDoc(doc(db, "students", studentToDelete.id));
      setStudents(
        students.filter((student) => student.id !== studentToDelete.id)
      );
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      toast.success("Student deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      setError("Failed to delete student. Please try again.");
      toast.error("Failed to delete student!", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  return (
    <div className="student-management-container">
      <div className="student-management">
        <h2 className="management-header">
          <FaGraduationCap /> Student Management
        </h2>

        {/* Error display */}
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
        <div className="table-controls">
          <div className="left-controls">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="filter-controls">
              <div className="filter-dropdown">
                <label>Course:</label>
                <select
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setYearLevelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setSemesterFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                disabled={
                  !courseFilter &&
                  !yearLevelFilter &&
                  !semesterFilter &&
                  !searchTerm
                }
              >
                <FaFilter /> Reset Filters
              </button>
            </div>

            <div className="enroll-buttons">
              <button
                className="enroll-btn primary"
                onClick={() => setShowNewEnrollModal(true)}
              >
                <FaUserPlus /> Enroll New Student
              </button>
              <button
                className="enroll-btn secondary"
                onClick={() => setShowExistingEnrollModal(true)}
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
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
              <button className="export-btn" onClick={exportToExcel}>
                <FaFileExcel /> Excel
              </button>
              <button className="export-btn" onClick={exportToPDF}>
                <FaFilePdf /> PDF
              </button>
              <CSVLink
                data={prepareExportData()}
                filename={`students_${departmentTab}_${new Date().toISOString().slice(0, 10)}.csv`}
                className="export-btn"
              >
                <FaFileExcel /> CSV
              </CSVLink>
              <button className="export-btn" onClick={printTable}>
                <FaPrint /> Print
              </button>
              <button
                className="export-btn"
                onClick={() => document.getElementById("import-file").click()}
              >
                <FaFileExcel /> Import
              </button>
              <input
                type="file"
                id="import-file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileImport}
              />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="students-table">
          {loading ? (
            <div className="loading-indicator">Loading students...</div>
          ) : (
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
                {currentItems.length > 0 ? (
                  currentItems.map((student) => (
                    <tr key={student.id}>
                      <td>{student.studentId}</td>
                      <td>
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt="Profile"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "#ccc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
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
                        <span
                          className={`status-badge ${student.status.toLowerCase()}`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            title="View"
                            onClick={() => {
                              setViewStudentId(student.id);
                              toast.info(
                                `Viewing ${student.firstName} ${student.lastName}'s details`,
                                {
                                  position: "top-right",
                                  autoClose: 2000,
                                }
                              );
                            }}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="edit-btn"
                            title="Edit"
                            onClick={() => {
                              setEditingStudent(student);
                              setShowEditModal(true);
                              toast.info(
                                `Editing ${student.firstName} ${student.lastName}'s record`,
                                {
                                  position: "top-right",
                                  autoClose: 2000,
                                }
                              );
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            title="Delete"
                            onClick={() => handleDeleteClick(student)}
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <DeleteConfirmationModal
                          isOpen={deleteModalOpen}
                          onClose={cancelDelete}
                          onConfirm={confirmDelete}
                          student={studentToDelete}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="no-data">
                      {students.length === 0
                        ? "No students found in this department"
                        : "No matching students found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

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

        {/* Enroll Modal */}
        <EnrollModal
          show={showNewEnrollModal}
          onClose={() => setShowNewEnrollModal(false)}
        />

        {/* Existing Student Enrollment Modal */}
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

        {importModalOpen && (
          <div className="import-modal-overlay">
            <div className="import-modal">
              <h3>Import Students</h3>
              <p>File: {importFile?.name}</p>

              <div className="import-info">
                <p>
                  <strong>Note:</strong> Students will be imported to their
                  specified departments.
                </p>
                <p>Valid department values: College, TVET, SHS, JHS</p>
              </div>

              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>

              <p className="import-status">{importStatus}</p>

              <div className="import-actions">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportFile(null);
                    setImportProgress(0);
                    setImportStatus("");
                  }}
                  disabled={importProgress > 0 && importProgress < 100}
                >
                  Cancel
                </button>
                <button
                  onClick={processImport}
                  disabled={
                    !importFile || (importProgress > 0 && importProgress < 100)
                  }
                >
                  {importProgress === 0 ? "Start Import" : "Importing..."}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
