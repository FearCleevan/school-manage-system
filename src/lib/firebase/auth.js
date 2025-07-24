//src/lib/firebase/auth.js
import { auth, db } from './config';
import { 
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function createAuthUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user; // Returns user object with UID
  } catch (error) {
    console.error("Error creating auth user:", error);
    throw error;
  }
}

export async function createUserDocument(user, additionalData = {}) {
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      role: additionalData.role || 'user', // default role
      status: additionalData.status || 'active', // default status
      ...additionalData
    });
    return userRef;
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
}

// src/lib/firebase/auth.js
export async function updateUserPassword(currentUser, currentPassword, newPassword) {
  try {
    // Verify we have a current user
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user available');
    }

    // Create credentials with the current password
    const credential = EmailAuthProvider.credential(
      currentUser.email, 
      currentPassword
    );
    
    // Reauthenticate the user
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update the password
    await updatePassword(currentUser, newPassword);
    
    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}