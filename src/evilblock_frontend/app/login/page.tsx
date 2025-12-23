'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmail } from '@/lib/firebase/auth';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import FaultyTerminal from '@/components/ui/FaultyTerminal';
import TextType from '@/components/ui/TextType';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmail(email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox.');
        setLoading(false);
        return;
      }

      // Get ID token and create session
      const idToken = await userCredential.user.getIdToken();
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        // Use router.refresh() to update server components and then navigate
        router.refresh();
        router.push(from);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create session');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <FaultyTerminal 
          className="w-full h-full"
          scale={1.2}
          tint="#ffa600ff"
          brightness={0.8}
          scanlineIntensity={0.5}
          glitchAmount={1.2}
          flickerAmount={0.8}
          mouseReact={true}
          pageLoadAnimation={true}
        />
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-white p-12 pointer-events-none">
          <div className="max-w-2xl text-center">
            <TextType
              text="Welcome to Eviblock"
              as="h1"
              className="text-7xl md:text-8xl font-bold mb-6"
              typingSpeed={100}
              loop={false}
              showCursor={true}
              cursorCharacter="_"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
            {error && (
              <div className="rounded-lg bg-black text-white border border-black p-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-black hover:text-gray-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-black hover:text-gray-700">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
