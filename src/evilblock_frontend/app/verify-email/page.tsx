'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { logOut, resendVerificationEmail, verifyEmail } from '@/lib/firebase/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get('oobCode');
  const email = searchParams.get('email');
  const [verifying, setVerifying] = useState(!!oobCode);
  const [checkingStatus, setCheckingStatus] = useState(!oobCode);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode) return;

    const verify = async () => {
      try {
        await verifyEmail(oobCode);
        setSuccess(true);
        setVerifying(false);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: unknown) {
        setVerifying(false);
        const error = err as { code?: string; message?: string };
        if (error.code === 'auth/invalid-action-code') {
          setError('This verification link is invalid or has expired. Please request a new one.');
        } else if (error.code === 'auth/expired-action-code') {
          setError('This verification link has expired. Please request a new one.');
        } else {
          setError(error.message || 'Failed to verify email');
        }
      }
    };

    verify();
  }, [oobCode, router]);

  useEffect(() => {
    if (oobCode) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      await user.reload();
      if (user.emailVerified) {
        setSuccess(true);
        setCheckingStatus(false);
        await logOut();
        router.push('/login');
      } else {
        setCheckingStatus(false);
      }
    });

    const intervalId = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;

      await user.reload();
      if (user.emailVerified) {
        setSuccess(true);
        clearInterval(intervalId);
        await logOut();
        router.push('/login');
      }
    }, 3000);

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [oobCode, router]);

  const handleResend = async () => {
    setError('');
    setResentMessage('');
    setResending(true);

    try {
      await resendVerificationEmail();
      setResentMessage('Verification email sent again. Please check your inbox.');
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      if (authError.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a moment before resending.');
      } else if (authError.code === 'auth/user-token-expired') {
        setError('Session expired. Please sign up or log in again.');
      } else {
        setError(authError.message || 'Failed to resend verification email.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          {verifying && (
            <div className="rounded-md bg-black text-white p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Verifying your email address...
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-black text-white p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Email verified successfully!
                  </h3>
                  <p className="mt-2 text-sm">
                    Your email has been verified. You will be redirected to the login page shortly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!oobCode && !success && (
            <div className="rounded-md bg-black text-white p-4">
              <div className="flex">
                <div className="ml-1">
                  <h3 className="text-sm font-medium">Check your inbox</h3>
                  <p className="mt-2 text-sm">
                    {email
                      ? `We sent a verification link to ${email}.`
                      : 'We sent a verification link to your email address.'}
                  </p>
                  <p className="mt-1 text-xs text-gray-300">
                    This page will automatically redirect you to login once verification is complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {checkingStatus && !oobCode && (
            <div className="rounded-md bg-black text-white p-4">
              <p className="text-sm">Checking verification status...</p>
            </div>
          )}

          {resentMessage && (
            <div className="rounded-md bg-black text-white p-4">
              <p className="text-sm">{resentMessage}</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-black text-white p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Verification failed
                  </h3>
                  <p className="mt-2 text-sm">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-sm space-y-2">
            {!oobCode && !success && (
              <div>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-black hover:underline disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend verification email'}
                </button>
              </div>
            )}
            {success && (
              <div>
                <Link href="/login" className="font-medium text-black hover:underline">
                  Go to login now
                </Link>
              </div>
            )}
            {error && (
              <div>
                <Link href="/signup" className="font-medium text-black hover:underline">
                  Create a new account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Verifying...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
