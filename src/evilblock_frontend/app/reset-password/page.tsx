'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { completePasswordReset, validateResetCode } from '@/lib/firebase/auth';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(!!oobCode);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Password must contain at least one special character';
    return null;
  };

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid password reset link.');
      setValidating(false);
      return;
    }

    const validateCode = async () => {
      try {
        await validateResetCode(oobCode);
        setIsCodeValid(true);
      } catch (err: unknown) {
        const authError = err as { code?: string; message?: string };
        if (authError.code === 'auth/expired-action-code') {
          setError('This reset link has expired. Please request a new one.');
        } else if (authError.code === 'auth/invalid-action-code') {
          setError('This reset link is invalid or already used.');
        } else {
          setError(authError.message || 'Unable to validate reset link.');
        }
      } finally {
        setValidating(false);
      }
    };

    validateCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !isCodeValid) return;

    setError('');
    setSuccess('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await completePasswordReset(oobCode, newPassword);
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      if (authError.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
      } else if (authError.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or already used.');
      } else {
        setError(authError.message || 'Failed to reset password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Set new password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Choose a strong new password for your account.</p>
        </div>

        {validating && (
          <div className="rounded-md bg-black text-white p-4">
            <p className="text-sm">Validating reset link...</p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-black text-white p-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-black text-white p-4">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {!validating && isCodeValid && !success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-black placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-black placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}

        <div className="text-center text-sm space-y-2">
          <div>
            <Link href="/login" className="font-medium text-black hover:underline">
              Back to sign in
            </Link>
          </div>
          {!isCodeValid && !validating && (
            <div>
              <Link href="/forgot-password" className="font-medium text-black hover:underline">
                Request a new reset link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
