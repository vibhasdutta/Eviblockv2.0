// Auth utility functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signOut,
  User,
  onAuthStateChanged,
  applyActionCode,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from './config';
import { createUserDocument } from './firestore';

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update profile with display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  
  // Create user document in Firestore
  if (userCredential.user) {
    await createUserDocument(
      userCredential.user.uid,
      userCredential.user.email,
      displayName || null
    );
    // Send email verification
    await sendEmailVerification(userCredential.user, {
      url: `${window.location.origin}/verify-email`,
      handleCodeInApp: true,
    });
  }
  
  return userCredential;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Update user profile (display name)
export const updateUserProfile = async (displayName?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  if (displayName !== undefined) {
    await updateProfile(user, { displayName });
    
    // Update Firestore document
    const { updateUserProfile: updateFirestoreProfile } = await import('./firestore');
    await updateFirestoreProfile(user.uid, { displayName });
  }
};

// Update user email (requires recent authentication)
export const updateUserEmail = async (newEmail: string, currentPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user logged in');
  
  // Reauthenticate user before updating email
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update email
  await updateEmail(user, newEmail);
  
  // Update Firestore document
  const { createUserDocument } = await import('./firestore');
  await createUserDocument(user.uid, newEmail, user.displayName);
  
  // Send verification email to new address
  await sendEmailVerification(user);
};

// Update user password (requires recent authentication)
export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user logged in');
  
  // Reauthenticate user before updating password
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update password
  await updatePassword(user, newPassword);
};

// Send password reset email
export const resetPassword = async (email: string) => {
  return await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  });
};

// Resend verification email for currently authenticated user
export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user found');

  return await sendEmailVerification(user, {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: true,
  });
};

// Validate password reset code from email link
export const validateResetCode = async (oobCode: string) => {
  return await verifyPasswordResetCode(auth, oobCode);
};

// Confirm new password with reset code
export const completePasswordReset = async (oobCode: string, newPassword: string) => {
  return await confirmPasswordReset(auth, oobCode, newPassword);
};

// Sign out
export const logOut = async () => {
  return await signOut(auth);
};

// Verify email with action code
export const verifyEmail = async (actionCode: string) => {
  return await applyActionCode(auth, actionCode);
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
