import { generateAppCSP, isAllowedOrigin } from '@/api';
import { ENV } from '@/api/environmentVariables';
import { NextRequest } from 'next/server';
import { authCSPConfig } from './src/csp-config';
import { updateSessionOrRedirect } from './src/supabase/middleware';

/**
 * Middleware pour ajouter à chaque requête les en-têtes CSP et CORS
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 *
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Get the hostname of the request, e.g. 'app.territoiresentransitions.fr'
  // We cannot simply use `url.hostname` because it returns '0.0.0.0' in Docker environment
  url.hostname = request.headers.get('host') ?? url.hostname;
  url.port = ENV.node_env !== 'development' ? '443' : url.port;

  // Génère la configuration CSP pour cette app
  const { cspHeader, nonce } = generateAppCSP(request, authCSPConfig);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = await updateSessionOrRedirect(request);

  // ajoute les en-têtes CSP à la réponse
  response.headers.set('Content-Security-Policy', cspHeader);

  // ajoute l'en-tête 'Access-Control-Allow-Origin' si l'origine de la requête est valide
  const origin = request.headers.get('origin');
  if (
    origin &&
    isAllowedOrigin(
      origin,
      process.env.NODE_ENV,
      process.env.ALLOWED_ORIGIN_PATTERN
    )
  ) {
    response.headers.append('Access-Control-Allow-Origin', origin);
  }

  // ajoute les autres en-têtes CORS
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
      source:
        '/((?!api|ingest|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',

      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
