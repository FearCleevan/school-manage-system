import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const actionTemplates = {
  user_created: (data) => ({
    action: 'created a new user account',
    details: `${data.email} (${data.role})`
  }),
  user_updated: (data) => ({
    action: 'updated user account',
    details: `${data.email}`
  }),
  user_deleted: (data) => ({
    action: 'deleted user account',
    details: `${data.email}`
  }),
  student_created: (data) => ({
    action: 'added new student',
    details: `${data.studentId} - ${data.firstName} ${data.lastName}`
  }),
  student_updated: (data) => ({
    action: 'updated student record',
    details: `${data.studentId}`
  }),
  student_deleted: (data) => ({
    action: 'deleted student record',
    details: `${data.studentId}`
  }),
  subject_created: (data) => ({
    action: 'added new subject',
    details: `${data.subjectId} - ${data.subjectName}`
  }),
  subject_updated: (data) => ({
    action: 'updated subject',
    details: `${data.subjectId}`
  }),
  subject_deleted: (data) => ({
    action: 'deleted subject',
    details: `${data.subjectId}`
  }),
  enrollment_created: (data) => ({
    action: 'enrolled student',
    details: `${data.studentId} in ${data.course}`
  }),
  default: (data) => ({
    action: 'performed system action',
    details: JSON.stringify(data)
  })
};

export const logUserActivity = async (actionType, data) => {
  try {
    const template = actionTemplates[actionType] || actionTemplates.default;
    const { action, details } = template(data);

    const userName = data.firstName 
      ? `${data.firstName} ${data.lastName}` 
      : data.displayName || 'System';
    const userEmail = data.email || 'system@example.com';

    const docRef = await addDoc(collection(db, 'activities'), {
      action,
      details,
      userName,
      userEmail,
      timestamp: serverTimestamp(),
      type: actionType
    });

    console.log('Activity logged successfully:', docRef.id);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    toast.error('Failed to log activity');
    return false;
  }
};