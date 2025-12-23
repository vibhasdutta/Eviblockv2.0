'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithEmail } from '@/lib/firebase/auth';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import FaultyTerminal from '@/components/ui/FaultyTerminal';
import TextType from '@/components/ui/TextType';

export default function Signup() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password, displayName);
      setSuccess('Account created! Please check your email to verify your account before logging in.');
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(error.message || 'Failed to create account');
      }
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
          tint="#39ff14"
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
              text="Join Eviblock Today"
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

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-6">
          <form className="space-y-5" onSubmit={handleEmailSignup}>
            {error && (
              <div className="rounded-lg bg-black text-white border border-black p-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="rounded-lg bg-black text-white border border-black p-4">
                <p className="text-sm">{success}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
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
                    autoComplete="new-password"
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                <ul className="space-y-1 text-xs">
                  <li className={password.length >= 8 ? 'text-black font-semibold' : 'text-gray-500'}>
                    ✓ At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-black font-semibold' : 'text-gray-500'}>
                    ✓ One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-black font-semibold' : 'text-gray-500'}>
                    ✓ One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-black font-semibold' : 'text-gray-500'}>
                    ✓ One number
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-black font-semibold' : 'text-gray-500'}>
                    ✓ One special character
                  </li>
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-black hover:text-gray-700">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
