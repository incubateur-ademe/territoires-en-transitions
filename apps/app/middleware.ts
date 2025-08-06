import { getAuthUrl } from '@/api';
import { ENV } from '@/api/environmentVariables';
import { dcpFetch } from '@/api/users/dcp.fetch';
import { fetchUserCollectivites } from '@/api/users/user-collectivites.fetch.server';
import { createClient } from '@/api/utils/supabase/middleware-client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  finaliserMonInscriptionUrl,
  invitationPath,
  makeTdbCollectiviteUrl,
  profilPath,
  recherchesPath,
  resetPwdPath,
  signInPath,
  signUpPath,
} from './src/app/paths';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (API routes)
     * - ingest/ rewrites
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source:
        '/((?!api|ingest|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',

      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Get the hostname of the request, e.g. 'app.territoiresentransitions.fr'
  // We cannot simply use `url.hostname` because it returns '0.0.0.0' in Docker environment
  url.hostname = request.headers.get('host') ?? url.hostname;
  // Only force HTTPS port in production and not for localhost
  url.port = ENV.node_env !== 'development' ? '443' : url.port;

  if (isAuthPathname(pathname)) {
    const searchParams = new URLSearchParams({
      redirect_to: new URL('/', url).toString(),
    });

    return redirectToAuthDomain(pathname, searchParams, url.hostname);
  }

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = await createClient(request, supabaseResponse);

  // IMPORTANT:
  // Avoid writing any logic between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is not authenticated, redirect to the home page
  if (!user) {
    if (!isPublicPathname(pathname)) {
      return NextResponse.redirect(new URL('/', url));
    }

    return supabaseResponse;
  }

  // ↓ After this line the user is authenticated

  const userDetails = await dcpFetch({
    dbClient: supabase,
    user_id: user.id,
  });

  // If the user is authenticated but no personal data have been filled
  // → redirect to the personal data form
  if (!userDetails) {
    const searchParams = new URLSearchParams({
      view: 'etape3',
      redirect_to: url.toString(),
    });

    return redirectToAuthDomain(signUpPath, searchParams, url.hostname);
  }

  // Check if the user has at least one collectivite
  // If not, redirect to the page finaliser mon inscription
  const collectivites = await fetchUserCollectivites(supabase);
  if (collectivites.length === 0) {
    if (isAllowedPathnameWhenNoCollectivite(pathname)) {
      return supabaseResponse;
    }

    return NextResponse.redirect(new URL(finaliserMonInscriptionUrl, url));
  }

  // If pathname is not the home page, let the response being handled by the app router
  if (pathname !== '/') {
    return supabaseResponse;
  }

  // Else redirect to the best welcome page depending on the user's context
  const collectiviteId = collectivites[0].collectivite_id;

  const tableauBordUrl = makeTdbCollectiviteUrl({
    collectiviteId,
    view: 'synthetique',
  });

  return NextResponse.redirect(new URL(tableauBordUrl, url));
}

function isAuthPathname(pathname: string) {
  return (
    pathname.startsWith(signInPath) ||
    pathname.startsWith(signUpPath) ||
    pathname.startsWith(resetPwdPath)
  );
}

function isPublicPathname(pathname: string) {
  return pathname === '/' || pathname.startsWith(invitationPath);
}

function isAllowedPathnameWhenNoCollectivite(pathname: string) {
  return (
    pathname === finaliserMonInscriptionUrl ||
    pathname.startsWith(invitationPath) ||
    pathname.startsWith(recherchesPath) ||
    pathname.startsWith(profilPath)
  );
}

function redirectToAuthDomain(
  pathname: string,
  searchParams: URLSearchParams,
  originHostname: string
) {
  const authUrl = getAuthUrl(pathname, searchParams, originHostname);
  return NextResponse.redirect(authUrl);
}
