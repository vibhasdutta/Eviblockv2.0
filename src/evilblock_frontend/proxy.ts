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
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
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

  // Verify session validity for authenticated routes
  if (isAuthenticated && !isPublicRoute) {
    try {
      // Verify session with API route
      const verifyUrl = new URL('/api/auth/me', request.url);
      const response = await fetch(verifyUrl, {
        headers: {
          Cookie: `session=${session.value}`,
        },
      });

      const data = await response.json();

      // If session is invalid, clear cookie and redirect to login
      if (!data.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const redirectResponse = NextResponse.redirect(loginUrl);
        redirectResponse.cookies.delete('session');
        return redirectResponse;
      }

      // Add user info to headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', data.user.uid);
      requestHeaders.set('x-user-email', data.user.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Session verification error:', error);
      // On error, redirect to login
      const loginUrl = new URL('/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('session');
      return redirectResponse;
    }
  }

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
