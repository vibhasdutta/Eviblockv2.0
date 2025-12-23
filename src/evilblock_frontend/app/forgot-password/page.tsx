'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/firebase/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Please check your inbox and follow the instructions.');
      setEmail('');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(error.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
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
          
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-black placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>

          <div className="text-center text-sm space-y-2">
            <div>
              <Link href="/login" className="font-medium text-black hover:underline">
                Back to sign in
              </Link>
            </div>
            <div>
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link href="/signup" className="font-medium text-black hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
