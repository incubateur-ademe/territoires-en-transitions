import { generateAppCSP } from '@/api/csp';
import { NextRequest, NextResponse } from 'next/server';
import { panierCSPConfig } from './src/csp-config';

/**
 * Middleware pour ajouter à chaque requête les en-têtes CSP
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 *
 */
export function middleware(request: NextRequest) {
  // Génère la configuration CSP pour cette app
  const { cspHeader, nonce } = generateAppCSP(request, panierCSPConfig);

  // crée et complète l'objet `Headers`
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // ajoute les en-têtes à la réponse
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

/**
 * Evite que le middleware soit appliqué à certaines routes
 */
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
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
