import {NextRequest, NextResponse} from 'next/server';
import {createClient} from './src/supabase/actions';

/**
 * Middleware pour ajouter à chaque requête les en-têtes CSP
 * et vérifier/rafraîchir le Auth token supabase
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 *     https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 */
export async function middleware(request: NextRequest) {
  // pour compléter les en-têtes de la requête
  const requestHeaders = new Headers(request.headers);

  // crée la réponse
  const response = NextResponse.next({request: {headers: requestHeaders}});

  // ajoute la CSP aux en-têtes
  addCspHeaders(request.nextUrl.host, requestHeaders, response.headers);

  // contrôle et rafraichit le Auth token du client supabase
  const supabase = createClient(request.cookies, response.cookies);
  await supabase.auth.getUser();

  return response;
}

/** Ajoute la CSP aux en-têtes */
const addCspHeaders = (
  host: string,
  requestHeaders: Headers,
  responseHeaders: Headers,
) => {
  // génère un id à chaque requête
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // on autorise 'unsafe-eval' et 'unsafe-inline' en mode dev. pour que les pages
  // ne soient pas bloquées par le chargement des sources-map
  // Ref: https://github.com/vercel/next.js/issues/14221
  const scriptSrc =
    process.env.NODE_ENV === 'production'
      ? `'self' 'nonce-${nonce}' 'strict-dynamic';`
      : `'self' 'unsafe-eval' 'unsafe-inline'`;

  // on autorise les styles `unsafe-inline` à cause notamment d'un problème avec le commposant next/image
  // Ref: https://github.com/vercel/next.js/issues/45184
  const styleSrc = `'self' 'unsafe-inline'`;

  // options de la politique de sécurité
  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src ${styleSrc};
    img-src 'self' blob: data: ytimg.com ${process.env.NEXT_PUBLIC_STRAPI_URL?.replace(
      'strapiapp',
      'media.strapiapp',
    )};
    font-src 'self';
    object-src 'none';
    connect-src 'self'
      ${process.env.NEXT_PUBLIC_SUPABASE_URL!} 
      ${process.env.NEXT_PUBLIC_STRAPI_URL!}
      ws://${host};
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src youtube.com www.youtube.com dailymotion.com www.dailymotion.com;
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

  // supprime les retours à la ligne et les espaces en trop
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  // ajoute la CSP aux en-têtes de la requête
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue,
  );

  // ajoute la CSP aux en-têtes de la réponse
  responseHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue,
  );
};

/**
 * Evite que le middleware soit appliqué à certaines routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        {type: 'header', key: 'next-router-prefetch'},
        {type: 'header', key: 'purpose', value: 'prefetch'},
      ],
    },
  ],
};
