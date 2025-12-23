// Firebase Admin SDK for server-side operations
import admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Use service account JSON file
  const serviceAccountPath = path.join(process.cwd(), 'eviblock-cbbc4-firebase-adminsdk-fbsvc-7bfa61a117.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminAuth = admin.auth();

export { adminAuth };
