import { getRequestUrl, isAllowedOrigin } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { DBClient } from '@tet/api/typeUtils';
import { dcpFetch } from '@tet/api/users/dcp.fetch';
import { fetchUserCollectivites } from '@tet/api/users/user-collectivites.fetch.server';
import { getRootDomain } from '@tet/api/utils/pathUtils';
import { getNextResponseWithUpdatedSupabaseSession } from '@tet/api/utils/supabase/proxy-client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getContentSecurityPolicy } from './content-security-policy.config';
import {
  collectiviteBasePath,
  errorPath,
  finaliserMonInscriptionUrl,
  invitationPath,
  invitePath,
  profilPath,
  recherchesPath,
  rejoindreCollectivitePath,
  resetPwdPath,
  signInPath,
  signUpPath,
  tdbPathShortcut,
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
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx|docx|pdf|txt|ods|woff2)$).*)',

      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

export async function proxy(request: NextRequest) {
  const url = getRequestUrl(request);

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const contentSecurityPolicy = getContentSecurityPolicy(url, nonce);

  const headers = new Headers();
  // Add the current path to the headers to get it available in RSCs
  headers.set('x-current-path', request.nextUrl.pathname);
  headers.set('x-nonce', nonce);
  // Next.js lit la CSP et le nonce depuis les en-têtes de *requête* pour poser le
  // nonce sur ses propres scripts inline ; ces en-têtes sont fusionnés côté
  // requête par getNextResponseWithUpdatedSupabaseSession.
  headers.set('Content-Security-Policy', contentSecurityPolicy);

  // Résout la session / les redirections d'auth (logique existante), puis pose
  // la CSP globale sur la réponse finale, quelle que soit la branche empruntée.
  const response = await getSessionResponse(request, url, headers);

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  // Ajoute l'en-tête 'Access-Control-Allow-Origin' si l'origine de la requête
  // est autorisée, puis les autres en-têtes CORS sur toutes les réponses
  // (fidèle à l'ancien middleware de apps/auth).
  const origin = request.headers.get('origin');
  if (
    origin &&
    isAllowedOrigin(
      origin,
      ENV.application_env === 'ci' ? 'ci' : process.env.NODE_ENV,
      process.env.ALLOWED_ORIGIN_PATTERN
    )
  ) {
    response.headers.append('Access-Control-Allow-Origin', origin);
  }
  response.headers.append('Access-Control-Allow-Credentials', 'true');
  response.headers.append(
    'Access-Control-Allow-Methods',
    'GET,DELETE,PATCH,POST,PUT,OPTIONS'
  );
  response.headers.append(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey, authorization'
  );

  return response;
}

/**
 * Logique de session et de redirection existante de l'app.
 * Renvoie la réponse à servir, sur laquelle la CSP est ensuite appliquée.
 */
async function getSessionResponse(
  request: NextRequest,
  url: URL,
  headers: Headers
): Promise<NextResponse> {
  const { supabaseResponse, supabaseUser, supabaseClient } =
    await getNextResponseWithUpdatedSupabaseSession({ request, headers });

  const pathname = url.pathname;

  if (isAuthPathname(pathname)) {
    // ── BRANCHE AUTH (les routes (auth) sont servies en local) ──

    // Utilisateur non authentifié → on sert la page d'auth.
    if (!supabaseUser) {
      return supabaseResponse;
    }

    const userDetails = await dcpFetch({
      dbClient: supabaseClient,
      user_id: supabaseUser.sub,
    });

    // Authentifié mais sans données perso (DCP) → complétion du profil.
    if (!userDetails) {
      // On sert /signup pour permettre la complétion.
      if (pathname.startsWith(signUpPath)) {
        return supabaseResponse;
      }
      // Sinon redirige vers /signup?view=etape3 (même origine, on conserve la query).
      url.pathname = signUpPath;
      url.searchParams.set('view', 'etape3');
      return NextResponse.redirect(url);
    }

    // A des DCP → liste blanche des routes servies (décision produit : /login est servi).
    if (
      pathname.startsWith(signInPath) ||
      pathname.startsWith(resetPwdPath) ||
      pathname.startsWith(rejoindreCollectivitePath) ||
      pathname.startsWith(invitePath) ||
      pathname.startsWith(errorPath)
    ) {
      return supabaseResponse;
    }

    // Sinon (ex. /signup avec DCP) → redirige vers redirect_to (même root) ou APP_URL.
    const redirectTo = url.searchParams.get('redirect_to');
    if (redirectTo?.startsWith('http')) {
      const newUrl = new URL(redirectTo);
      if (getRootDomain(newUrl.hostname) === getRootDomain(url.hostname)) {
        return NextResponse.redirect(newUrl);
      }
    }
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL as string);
    if (redirectTo?.startsWith('/')) {
      appUrl.pathname = redirectTo;
    }
    return NextResponse.redirect(appUrl);
  }

  // ── BRANCHE APP (logique existante) ──

  // If the user is not authenticated, redirect to the home page
  if (!supabaseUser) {
    if (!isPublicPathname(pathname)) {
      return NextResponse.redirect(new URL('/', url));
    }

    return supabaseResponse;
  }

  // ↓ After this line the user is authenticated

  const userDetails = await dcpFetch({
    dbClient: supabaseClient,
    user_id: supabaseUser.sub,
  });

  // If the user is authenticated but no personal data have been filled
  // → redirect to the personal data form (même origine)
  if (!userDetails) {
    const searchParams = new URLSearchParams({
      view: 'etape3',
      redirect_to: url.toString(),
    });

    return NextResponse.redirect(
      new URL(`${signUpPath}?${searchParams}`, url)
    );
  }

  // Check if the user has at least one collectivite
  // If not, redirect to the page finaliser mon inscription
  const collectivites = await fetchUserCollectivites(
    supabaseClient as DBClient
  );
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

  // Else redirect to the tableau de bord
  return NextResponse.redirect(new URL(tdbPathShortcut, url));
}

function isAuthPathname(pathname: string) {
  return (
    pathname.startsWith(signInPath) ||
    pathname.startsWith(signUpPath) ||
    pathname.startsWith(resetPwdPath) ||
    pathname.startsWith(invitePath) ||
    pathname.startsWith(rejoindreCollectivitePath) ||
    pathname.startsWith(errorPath)
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
    pathname.startsWith(profilPath) ||
    pathname.startsWith(collectiviteBasePath)
  );
}
