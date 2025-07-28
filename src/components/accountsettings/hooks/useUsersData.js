import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../accountUserSettings.css';

export const useUsersData = (activeTab, currentUser) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    try {
      const usersQuery = currentUser.role === 'admin'
        ? query(collection(db, 'users'), where('role', '==', activeTab))
        : query(collection(db, 'users'), where('role', '==', activeTab));

      const unsubscribe = onSnapshot(
        usersQuery,
        (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(usersData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Firestore error:", error);
          setError('Failed to load users');
          setLoading(false);
          toast.error('Failed to load users');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up listener:", err);
      setError('Error initializing data');
      setLoading(false);
      toast.error('Error initializing data');
    }
  }, [activeTab, currentUser]);

  return { users, loading, error, setUsers };
};