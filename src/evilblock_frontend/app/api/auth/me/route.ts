// API route to get current session
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(session.value, true);
    
    // Get user record to retrieve displayName
    const userRecord = await adminAuth.getUser(decodedClaims.uid);
    
    return NextResponse.json({ 
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        emailVerified: decodedClaims.email_verified,
        displayName: userRecord.displayName || null
      }
    });
  } catch (error: unknown) {
    console.error('Session verification error:', error);
    return NextResponse.json({ user: null });
  }
}
