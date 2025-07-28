import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../subjects.css';

export const useSubjectsExports = () => {
  const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
    XLSX.writeFile(workbook, `subjects_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = (data, filters) => {
    const doc = new jsPDF();
    
    doc.text(`Subjects List`, 14, 15);
    
    let filtersInfo = [];
    if (filters.courseFilter !== 'All') filtersInfo.push(`Course: ${filters.courseFilter}`);
    if (filters.yearLevelFilter !== 'All') filtersInfo.push(`Year Level: ${filters.yearLevelFilter}`);
    if (filters.semesterFilter !== 'All') filtersInfo.push(`Semester: ${filters.semesterFilter}`);
    if (filters.searchTerm) filtersInfo.push(`Search: "${filters.searchTerm}"`);

    if (filtersInfo.length > 0) {
      doc.text(`Filters: ${filtersInfo.join(", ")}`, 14, 25);
    }

    const tableData = data.map((subject) => [
      subject.subjectId,
      subject.subjectName,
      subject.course,
      subject.yearLevel,
      subject.semester,
      subject.status,
    ]);

    doc.autoTable({
      head: [["ID", "Name", "Course", "Year Level", "Semester", "Status"]],
      body: tableData,
      startY: filtersInfo.length > 0 ? 30 : 20,
      margin: { top: 20 },
    });

    doc.save(`subjects_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return { exportToExcel, exportToPDF };
};