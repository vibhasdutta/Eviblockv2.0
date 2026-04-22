import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
  '/about',
  '/contact',
];

// Define routes that should redirect authenticated users away
const authRoutes = ['/login', '/signup', '/forgot-password'];

// KYC flow protected routes - each route requires specific completion steps
// These are enforced via cookies set during the KYC flow
const kycProtectedRoutes: Record<string, { requiredCookie: string; redirectTo: string }> = {
  '/upload': { requiredCookie: 'kyc_step_1', redirectTo: '/kyc' },
  '/kyc/video-verification': { requiredCookie: 'kyc_step_2', redirectTo: '/upload' },
  '/kyc/questions': { requiredCookie: 'kyc_step_3', redirectTo: '/kyc/video-verification' },
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const routeMatches = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  // Allow static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session cookie
  const session = request.cookies.get('session');
  const isAuthenticated = !!session?.value;

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => routeMatches(route));
  const isAuthRoute = authRoutes.some(route => routeMatches(route));

  // Redirect authenticated users away from auth pages
  // But respect ?from= param so "Get Started" works for logged-in users
  if (isAuthenticated && isAuthRoute) {
    const from = request.nextUrl.searchParams.get('from');
    return NextResponse.redirect(new URL(from || '/', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // Save the original URL to redirect back after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check KYC flow protection for authenticated users
  if (isAuthenticated) {
    const protectedConfig = kycProtectedRoutes[pathname];
    if (protectedConfig) {
      const stepCookie = request.cookies.get(protectedConfig.requiredCookie);
      if (!stepCookie?.value) {
        // User hasn't completed the required step, redirect them
        return NextResponse.redirect(new URL(protectedConfig.redirectTo, request.url));
      }
    }
  }

  // For authenticated users on protected routes, the session cookie existence
  // is sufficient for middleware routing. Full session verification happens at
  // the page/API level (e.g., Navbar fetches /api/auth/me, API routes verify tokens).
  // This avoids self-referencing fetch deadlocks in dev mode.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
