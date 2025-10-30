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
          // First get the user document
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = {
              ...userDoc.data(),
              id: userDoc.id,
              isAdmin: userDoc.data().role === 'admin' || 
                      (userDoc.data().permissions && 
                       userDoc.data().permissions.includes('admin'))
            };
            setUserData(userData);
            
            // Force token refresh if admin status changed - with better error handling
            try {
              const tokenResult = await user.getIdTokenResult();
              if (userData.isAdmin !== !!tokenResult.claims.admin) {
                await user.getIdToken(true); // Force refresh
              }
            } catch (tokenError) {
              console.warn("Token refresh error:", tokenError);
              // Continue even if token refresh fails
            }
          } else {
            console.warn("User document not found for uid:", user.uid);
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Set user data to null but don't block the auth flow
          setUserData(null);
        }
      } else {
        setUserData(null);
        setCurrentUser(null);
      }
      
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      // Handle auth state change errors
      console.error("Auth state change error:", error);
      setCurrentUser(null);
      setUserData(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    hasPermission: (permission) => {
      if (!userData) return false;
      if (userData.isAdmin) return true;
      return userData.permissions?.includes(permission) || false;
    },
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