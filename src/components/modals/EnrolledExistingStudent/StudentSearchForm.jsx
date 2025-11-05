import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import styles from './ExistingStudentEnroll.module.css';

const StudentSearchForm = ({ 
  studentId, 
  setStudentId, 
  fetchStudentData, 
  loading, 
  searchPerformed 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Fetch suggestions based on search query
  const fetchSuggestions = async (queryText) => {
    if (!queryText.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      const studentsRef = collection(db, 'students');
      
      // Create query for studentId, firstName, and lastName
      const searchQuery = query(
        studentsRef,
        or(
          where('studentId', '>=', queryText.toUpperCase()),
          where('studentId', '<=', queryText.toUpperCase() + '\uf8ff'),
          where('firstName', '>=', queryText),
          where('firstName', '<=', queryText + '\uf8ff'),
          where('lastName', '>=', queryText),
          where('lastName', '<=', queryText + '\uf8ff')
        )
      );

      const querySnapshot = await getDocs(searchQuery);
      const suggestionsData = [];

      querySnapshot.forEach((doc) => {
        const studentData = doc.data();
        suggestionsData.push({
          id: doc.id,
          studentId: studentData.studentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          middleName: studentData.middleName,
          department: studentData.department,
          status: studentData.status
        });
      });

      // Sort suggestions by relevance (exact matches first)
      const sortedSuggestions = suggestionsData.sort((a, b) => {
        const aIdMatch = a.studentId?.toLowerCase().startsWith(queryText.toLowerCase());
        const bIdMatch = b.studentId?.toLowerCase().startsWith(queryText.toLowerCase());
        
        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;
        
        return a.studentId?.localeCompare(b.studentId);
      });

      setSuggestions(sortedSuggestions);
      setShowSuggestions(sortedSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  // Handle input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setStudentId(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setStudentId(suggestion.studentId);
    setSearchQuery(suggestion.studentId);
    setShowSuggestions(false);
    // Auto-search when suggestion is selected
    setTimeout(() => {
      fetchStudentData();
    }, 100);
  };

  const handleSearchClick = () => {
    setShowSuggestions(false);
    fetchStudentData();
  };

  const formatStudentName = (student) => {
    return `${student.lastName}, ${student.firstName}${student.middleName ? ` ${student.middleName.charAt(0)}.` : ''}`;
  };

  return (
    <div className={styles.searchContainer} ref={suggestionsRef}>
      <div className={styles.studentIdInput}>
        <label htmlFor="existingStudentId" className={styles.formLabel}>
          Search Student
        </label>
        <div className={styles.searchInputWrapper}>
          <input
            id="existingStudentId"
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            className={styles.formInput}
            placeholder="Enter Student ID, First Name, or Last Name..."
            autoComplete="off"
          />
          {isFetchingSuggestions && (
            <div className={styles.suggestionLoading}>Searching...</div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.id}-${index}`}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className={styles.suggestionId}>{suggestion.studentId}</div>
                  <div className={styles.suggestionName}>
                    {formatStudentName(suggestion)}
                  </div>
                  <div className={styles.suggestionDepartment}>
                    {suggestion.department} • {suggestion.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className={styles.searchBtn}
          onClick={handleSearchClick}
          disabled={!studentId.trim() || loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {searchPerformed && !loading && (
        <p className={styles.notFoundMessage}>Student not found. Please check the ID and try again.</p>
      )}
    </div>
  );
};

export default StudentSearchForm;