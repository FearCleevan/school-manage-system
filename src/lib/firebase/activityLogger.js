import { db } from './config';
import { addDoc, collection } from 'firebase/firestore';

/**
 * Logs an activity to Firestore
 * @param {string} action - Description of the activity (e.g., "added a new student")
 * @param {object} details - Additional context about the activity
 * @param {string} userName - Name of the user who performed the action
 */
export const logActivity = async (action, details = {}, userName = 'System') => {
  try {
    await addDoc(collection(db, 'activities'), {
      action,
      details,
      userName,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Consider adding error reporting here if needed
  }
};