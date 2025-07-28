import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import '../subjects.css';

export const useSubjectsData = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const subjectsCollection = collection(db, 'subjects');
        const querySnapshot = await getDocs(subjectsCollection);

        const subjectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSubjects(subjectsData);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return { subjects, loading, error, setSubjects };
};