import { auth, db } from './config';
import { createUserWithEmailAndPassword } from "firebase/auth";
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