import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = {
              ...userDoc.data(),
              id: userDoc.id,
              // Ensure admin status is properly set
              isAdmin: userDoc.data().role === 'admin' || 
                      (userDoc.data().permissions && 
                       userDoc.data().permissions.includes('admin'))
            };
            setUserData(userData);
            
            // Update the user's auth token claims if needed
            if (userData.isAdmin && !user.token?.admin) {
              await auth.currentUser.getIdToken(true); // Force token refresh
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    // Enhanced permission checking
    hasPermission: (permission) => {
      if (!userData) return false;
      // Admin has all permissions
      if (userData.isAdmin) return true;
      // Check specific permissions
      return userData.permissions?.includes(permission) || false;
    },
    // Direct admin check
    isAdmin: () => {
      return userData?.isAdmin || false;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};