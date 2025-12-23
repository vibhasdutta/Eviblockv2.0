'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName?: string | null;
  photoURL?: string | null;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Not logged in</p>
          <Link href="/login" className="text-black hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
              <Link
                href="/profile/edit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Edit Profile
              </Link>
            </div>

            <div className="space-y-6">
              {/* User Information */}
              <div className="border-t border-gray-200 pt-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {user.displayName || 'Not set'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-lg text-gray-900">{user.email}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.emailVerified
                            ? 'bg-black text-white'
                            : 'bg-white text-black border border-black'
                        }`}
                      >
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                      {user.uid}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
