import { getRequestUrl } from '@tet/api';
import { getNextResponseWithUpdatedSupabaseSession } from '@tet/api/utils/supabase/proxy-client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getContentSecurityPolicy } from './content-security-policy.config';
import { applyCorsHeaders } from './cors.config';
import {
  authVerifyPath,
  invitationPath,
  authProconnectPath,
  makeSignInUrl,
  resetPwdPath,
  signInPath,
  signUpPath,
} from './src/app/paths';
import { sanitizeNextPath } from './src/users/authentications/sanitize-next-path';

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
  // Expose le chemin courant aux RSC. Valeur *dérivée du serveur*
  // (pathname + search) : getNextResponseWithUpdatedSupabaseSession la fusionne
  // via Headers.set(), écrasant tout `x-current-path` envoyé par le client. Les
  // RSC (ex. (authed)/layout, requireOnboardedUser) peuvent donc s'y fier.
  headers.set(
    'x-current-path',
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  headers.set('x-nonce', nonce);
  // Next.js lit la CSP et le nonce depuis les en-têtes de *requête* pour poser le
  // nonce sur ses propres scripts inline ; ces en-têtes sont fusionnés côté
  // requête par getNextResponseWithUpdatedSupabaseSession.
  headers.set('Content-Security-Policy', contentSecurityPolicy);

  // Rafraîchit la session Supabase (doit rester dans le proxy pour propager les
  // cookies) puis pose une garde *optimiste* : les décisions dépendantes des
  // données (DCP, collectivités) sont désormais prises dans la DAL / les layouts
  // authentifiés — voir src/users/data/require-onboarded-user.server.ts.
  const { supabaseResponse, supabaseUser } =
    await getNextResponseWithUpdatedSupabaseSession({ request, headers });

  const response =
    !supabaseUser && !isPublicPathname(url.pathname)
      ? NextResponse.redirect(
          new URL(
            makeSignInUrl(sanitizeNextPath(`${url.pathname}${url.search}`)),
            url
          )
        )
      : supabaseResponse;

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  applyCorsHeaders(response.headers, request.headers.get('origin'));

  return response;
}

function isPublicPathname(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith(invitationPath) ||
    pathname.startsWith(signInPath) ||
    pathname.startsWith(signUpPath) ||
    pathname.startsWith(resetPwdPath) ||
    // Pont de session OIDC (verifyOtp pose la session) et parcours de
    // bienvenue (cas 3) : atteints avant qu'une session Supabase existe.
    pathname.startsWith(authVerifyPath) ||
    pathname.startsWith(authProconnectPath)
  );
}
