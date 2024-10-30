import { ENV } from 'environmentVariables';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { resetPwdPath, signInPath, signUpPath } from './app/paths';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',

      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestUrl = new URL(request.nextUrl.href);

  // console.log('middleware.requestUrl', request.url);
  // console.log('middleware.nextPathname', pathname);

  if (isAuthUrl(pathname)) {
    return redirectToAuthDomain(requestUrl);
  }
}

function isAuthUrl(pathname: string) {
  return (
    pathname.startsWith(signInPath) ||
    pathname.startsWith(signUpPath) ||
    pathname.startsWith(resetPwdPath)
  );
}

function redirectToAuthDomain(requestUrl: URL) {
  const search = new URLSearchParams(requestUrl.search);
  if (!search.has('redirect_to')) {
    // Returns to the current URL if nothing is specified.
    // This ensures that the user is redirected to the domain it came from after authentication.
    search.append('redirect_to', requestUrl.href);
  }

  const authUrl = new URL(requestUrl.pathname, ENV.auth_url);
  authUrl.search = search.toString();

  return NextResponse.redirect(authUrl);
}
