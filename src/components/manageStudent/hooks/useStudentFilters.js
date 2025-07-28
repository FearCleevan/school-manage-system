//src/components/manageStudent/hooks/useStudentFilters.js
import { useState, useEffect } from 'react';
import '../studentManagement.css';

export const useStudentFilters = (departmentTab, departmentOptions) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableYearLevels, setAvailableYearLevels] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  useEffect(() => {
    const departmentData = departmentOptions[departmentTab] || {};
    setAvailableCourses(departmentData.courses || []);
    setAvailableYearLevels(departmentData.yearLevels || []);
    setAvailableSemesters(departmentData.semesters || []);

    setCourseFilter("");
    setYearLevelFilter("");
    setSemesterFilter("");
  }, [departmentTab, departmentOptions]);

  const resetFilters = () => {
    setCourseFilter("");
    setYearLevelFilter("");
    setSemesterFilter("");
    setSearchTerm("");
  };

  return {
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
  };
};