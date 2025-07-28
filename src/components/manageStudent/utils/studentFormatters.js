//src/components/manageStudent/utils/studentFormatters.js
export const formatFullName = (student) => {
  return `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ""}`;
};

export const formatAddress = (student) => {
  if (!student.address) return "";
  return `${student.address.street || ""}, ${student.address.city || ""}, ${student.address.province || ""} ${student.address.zipCode || ""}`;
};

export const getDepartmentLabel = (dept) => {
  const labels = {
    college: "College",
    tvet: "TVET",
    shs: "Senior High",
    jhs: "Junior High",
  };
  return labels[dept] || dept;
};