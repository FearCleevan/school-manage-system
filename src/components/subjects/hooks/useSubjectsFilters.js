import { useState } from 'react';
import '../subjects.css';

export const useSubjectsFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    course: 'All',
    yearLevel: 'All',
    semester: 'All',
    status: 'All'
  });

  const availableCourses = ['All', 'BSIT', 'BSHM', 'BSBA', 'BSTM', 'BTVTeD-AT', 'BTVTeD-HVACR TECH', 'BTVTeD-FSM', 'BTVTeD-ET', 'SHS', 'JHS'];
  const availableYearLevels = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Grade 11', 'Grade 12'];
  const availableSemesters = ['All', '1st Semester', '2nd Semester', 'Summer'];
  const availableStatuses = ['All', 'Active', 'Inactive'];

  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      course: 'All',
      yearLevel: 'All',
      semester: 'All',
      status: 'All'
    });
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    availableCourses,
    availableYearLevels,
    availableSemesters,
    availableStatuses,
    resetFilters
  };
};