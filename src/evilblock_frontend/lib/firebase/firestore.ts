// Firestore database utilities
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

// Create or update user document in Firestore
export const createUserDocument = async (
  uid: string,
  email: string | null,
  displayName: string | null = null
) => {
  const userRef = doc(db, 'users', uid);
  
  // Check if user already exists
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create new user document (uid is the document ID, no need to store it in the data)
    await setDoc(userRef, {
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing user document
    await updateDoc(userRef, {
      email,
      displayName,
      updatedAt: serverTimestamp(),
    });
  }
};

// Get user document from Firestore
export const getUserDocument = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName'>>
) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
