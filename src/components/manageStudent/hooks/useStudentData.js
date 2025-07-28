//src/components/manageStudent/hooks/useStudentData.js
import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import '../studentManagement.css';

export const useStudentData = (departmentTab, sortConfig, fieldMap) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentsRef = collection(db, "students");
        let q = query(studentsRef, where("department", "==", departmentTab));

        if (sortConfig.key && fieldMap[sortConfig.key]) {
          q = query(q, orderBy(fieldMap[sortConfig.key], sortConfig.direction));
        }

        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

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
  }, [departmentTab, sortConfig, fieldMap]);

  return { students, loading, error, setStudents };
};