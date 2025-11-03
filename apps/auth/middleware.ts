import { getRequestUrl, isAllowedOrigin } from '@/api';
import { ENV } from '@/api/environmentVariables';
import { getRootDomain } from '@/api/utils/pathUtils';
import { NextRequest } from 'next/server';
import { updateSessionOrRedirect } from './src/supabase/middleware';

/**
 * Middleware pour ajouter à chaque requête les en-têtes CSP et CORS
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 *
 */
export async function middleware(request: NextRequest) {
  const url = getRequestUrl(request);

  // Génère un id unique à chaque requête
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // on autorise 'unsafe-eval' et 'unsafe-inline' en mode dev. pour que les pages
  // ne soient pas bloquées par le chargement des sources-map
  // Ref: https://github.com/vercel/next.js/issues/14221
  const scriptSrc =
    process.env.NODE_ENV === 'production' && ENV.application_env !== 'ci'
      ? //      https://github.com/vercel/next.js/discussions/54152
        //      ? `'self' 'nonce-${nonce}'`
        `'self' 'unsafe-inline'` // TODO: supprimer cette ligne et rétablir la précédente
      : `'self' 'unsafe-eval' 'unsafe-inline'`;

  // on autorise les styles `unsafe-inline` à cause notamment d'un problème avec le commposant next/image
  // Ref: https://github.com/vercel/next.js/issues/45184
  const styleSrc = `'self' 'unsafe-inline'`;

  // options de la politique de sécurité
  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc} *.posthog.com;
    style-src ${styleSrc};
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    connect-src 'self'
      ${process.env.NEXT_PUBLIC_SUPABASE_URL}
      ${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('http', 'ws')}
      *.${getRootDomain(url.hostname)}
      ${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}
      *.posthog.com;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'none';
    block-all-mixed-content;
    ${
      /* ce header est activé uniquement en prod pour éviter que safari redirige tjrs en https en dev */
      process.env.NODE_ENV === 'production' &&
      ENV.application_env !== 'ci' &&
      url.hostname !== 'localhost'
        ? 'upgrade-insecure-requests;'
        : ''
    }
  `;

  // supprime les retours à la ligne et les espaces en trop
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  const response = await updateSessionOrRedirect(request);

  // ajoute les en-têtes CSP à la réponse
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  // ajoute l'en-tête 'Access-Control-Allow-Origin' si l'origine de la requête est valide
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
        '/((?!api|phtr|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',

      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
