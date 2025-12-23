'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, updateUserProfile, updateUserEmail, updateUserPassword } from '@/lib/firebase/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function EditProfile() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailProvider, setIsEmailProvider] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check server session
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.user) {
          router.push('/login');
          return;
        }

        // Then get full user from Firebase for editing
        const user = getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        
        // Check if user signed up with email/password
        const providers = user.providerData.map(p => p.providerId);
        setIsEmailProvider(providers.includes('password'));
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateUserProfile(displayName);
      setSuccess('Profile updated successfully!');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!currentPassword) {
      setError('Please enter your current password to update email');
      setLoading(false);
      return;
    }

    try {
      await updateUserEmail(email, currentPassword);
      setSuccess('Email updated successfully! Please verify your new email address.');
      setCurrentPassword('');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use');
      } else {
        setError(error.message || 'Failed to update email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!currentPassword || !newPassword) {
      setError('Please fill in all password fields');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await updateUserPassword(currentPassword, newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect current password');
      } else if (error.code === 'auth/weak-password') {
        setError('New password is too weak');
      } else {
        setError(error.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

            {error && (
              <div className="mb-6 rounded-md bg-black text-white p-4">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-md bg-black text-white p-4">
                <p className="text-sm">{success}</p>
              </div>
            )}

            {/* Update Display Name */}
            <form onSubmit={handleUpdateProfile} className="mb-8 border-b pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Display Name</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                >
                  Update Name
                </button>
              </div>
            </form>

            {isEmailProvider && (
              <>
                {/* Update Email */}
                <form onSubmit={handleUpdateEmail} className="mb-8 border-b pb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="relative">
                      <label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        id="currentPasswordEmail"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
                    >
                      Update Email
                    </button>
                  </div>
                </form>

                {/* Update Password */}
                <form onSubmit={handleUpdatePassword}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
                  <div className="space-y-4">
                    <div className="relative">
                      <label htmlFor="currentPasswordPwd" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        id="currentPasswordPwd"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-black rounded-md focus:outline-none focus:ring-black focus:border-black"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </>
            )}

            {!isEmailProvider && (
              <div className="text-center text-gray-600">
                <p>You signed in with Google. Email and password changes are managed through your Google account.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
