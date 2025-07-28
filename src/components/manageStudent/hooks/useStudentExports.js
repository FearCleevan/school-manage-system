//src/components/manageStudent/hooks/useStudentExports.js
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../studentManagement.css';

export const useStudentExports = () => {
  const exportToExcel = (data, departmentTab) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(
      workbook,
      `students_${departmentTab}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const exportToPDF = (data, departmentTab, filters) => {
    const doc = new jsPDF();
    
    doc.text(`Student List - ${getDepartmentLabel(departmentTab)}`, 14, 15);
    
    let filtersInfo = [];
    if (filters.courseFilter) filtersInfo.push(`Course: ${filters.courseFilter}`);
    if (filters.yearLevelFilter) filtersInfo.push(`Year Level: ${filters.yearLevelFilter}`);
    if (filters.semesterFilter) filtersInfo.push(`Semester: ${filters.semesterFilter}`);
    if (filters.searchTerm) filtersInfo.push(`Search: "${filters.searchTerm}"`);

    if (filtersInfo.length > 0) {
      doc.text(`Filters: ${filtersInfo.join(", ")}`, 14, 25);
    }

    const tableData = data.map((student) => [
      student.studentId,
      `${student.lastName}, ${student.firstName}`,
      student.phone,
      student.enrollment.course,
      student.enrollment.yearLevel,
      student.enrollment.semester,
      student.status,
    ]);

    doc.autoTable({
      head: [["ID", "Name", "Phone", "Course", "Year", "Semester", "Status"]],
      body: tableData,
      startY: filtersInfo.length > 0 ? 30 : 20,
      margin: { top: 20 },
    });

    doc.save(`students_${departmentTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const getDepartmentLabel = (dept) => {
    const labels = {
      college: "College",
      tvet: "TVET",
      shs: "Senior High",
      jhs: "Junior High",
    };
    return labels[dept] || dept;
  };

  return { exportToExcel, exportToPDF, getDepartmentLabel };
};