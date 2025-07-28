//src/components/manageStudent/utils/departmentOptions.js
export const departmentOptions = {
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

export const fieldMap = {
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