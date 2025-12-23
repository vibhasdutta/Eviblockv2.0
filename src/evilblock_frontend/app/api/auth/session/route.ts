// API route for server-side session management
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Verify the ID token and create session cookie
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if email is verified for email/password signups
    if (!decodedToken.email_verified && decodedToken.firebase.sign_in_provider === 'password') {
      return NextResponse.json({ 
        error: 'Email not verified. Please verify your email before signing in.' 
      }, { status: 403 });
    }

    // Set session expiration (5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Get user record to retrieve displayName
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ 
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: userRecord.displayName || null
      }
    });
  } catch (error: unknown) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}
