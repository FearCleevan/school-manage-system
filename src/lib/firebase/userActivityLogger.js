// src/lib/firebase/userActivityLogger.js
import { db, auth } from './config';
import { addDoc, collection } from 'firebase/firestore';

export const logUserActivity = async (action, details = {}) => {
  try {
    // Ensure auth is initialized
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    const currentUser = auth.currentUser;
    
    // Validate we have a user (or system action)
    if (!currentUser && action !== 'system_action') {
      throw new Error('No authenticated user found');
    }

    const activityData = {
      action,
      details,
      user: {
        id: currentUser?.uid || 'system',
        name: currentUser?.displayName || 'System',
        email: currentUser?.email || null
      },
      timestamp: new Date()
    };

    await addDoc(collection(db, 'activities'), activityData);
  } catch (error) {
    console.error('Failed to log user activity:', error);
    throw error; // Re-throw to handle in calling component
  }
};