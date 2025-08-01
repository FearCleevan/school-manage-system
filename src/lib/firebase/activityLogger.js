// Updated activityLogger.js
import { db } from './config';
import { addDoc, collection } from 'firebase/firestore';
import { auth } from './config';

/**
 * Logs an activity to Firestore
 * @param {string} action - Description of the activity
 * @param {object} [details={}] - Additional context about the activity
 * @param {string} [userName] - Optional display name of user
 */
export const logActivity = async (action, details = {}, userName) => {
  try {
    // Get current user if available
    const user = auth.currentUser;
    const userInfo = {
      id: user?.uid || 'system',
      name: userName || user?.displayName || 'System',
      email: user?.email || null
    };

    // Standardize activity data
    const activityData = {
      action,
      details: {
        ...details,
        // Add timestamp to details as well
        timestamp: new Date().toISOString()
      },
      user: userInfo,
      timestamp: new Date()
    };

    await addDoc(collection(db, 'activities'), activityData);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Consider using an error reporting service
    throw new Error('Failed to log activity');
  }
};