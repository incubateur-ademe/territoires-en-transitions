import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware pour ajouter à chaque requête les en-têtes CSP
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 *
 */
export function middleware(request: NextRequest) {
  // génère un id à chaque requête
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // on autorise 'unsafe-eval' et 'unsafe-inline' en mode dev. pour que les pages
  // ne soient pas bloquées par le chargement des sources-map
  // Ref: https://github.com/vercel/next.js/issues/14221
  const scriptSrc =
    process.env.NODE_ENV === 'production'
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
    script-src ${scriptSrc} *.axept.io *.posthog.com client.crisp.chat;
    style-src ${styleSrc} client.crisp.chat;
    img-src 'self' blob: data: axeptio.imgix.net image.crisp.chat client.crisp.chat;
    font-src 'self' client.crisp.chat;
    object-src 'none';
    connect-src 'self'
      ${process.env.NEXT_PUBLIC_SUPABASE_URL!}
      ${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('http', 'ws')}
      ws://${request.nextUrl.host}
      ws://127.0.0.1:54321
      client.crisp.chat
      wss://client.relay.crisp.chat
      wss://stream.relay.crisp.chat
      *.posthog.com
      *.axept.io;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

  // supprime les retours à la ligne et les espaces en trop
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  // crée et complète l'objet `Headers`
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  // ajoute les en-têtes à la réponse
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
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
      source: '/((?!api|phtr|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
