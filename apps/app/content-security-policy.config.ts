import { getRootDomain } from '@tet/api/utils/pathUtils';

/**
 * Construit la Content-Security-Policy globale posée sur toutes les routes de
 * l'app (mode bloquant).
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */
export function getContentSecurityPolicy(url: URL, nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production';

  // In development, 'unsafe-eval' is required because React uses eval
  // to provide enhanced debugging information, such as reconstructing
  // server-side error stacks in the browser. unsafe-eval is not required for production.
  // Neither React nor Next.js use eval in production by default.
  //
  // Ref: https://nextjs.org/docs/app/guides/content-security-policy#adding-a-nonce-with-proxy
  const scriptSrc = `'self' 'nonce-${nonce}' 'strict-dynamic'${
    !isProd ? " 'unsafe-eval'" : ''
  }`;

  // `unsafe-inline` requis par Crisp (et par les styles inline de next/image).
  // Pas de nonce ici : la présence d'un nonce désactiverait `unsafe-inline` côté
  // navigateur, ce qui bloquerait les styles inline de Crisp.
  const styleSrc = `'self' 'unsafe-inline'`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseWsUrl = supabaseUrl.replace('http', 'ws');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
  // Service d'auth : en prod c'est un sous-domaine couvert par `*.${rootDomain}`,
  // mais en dev/CI il tourne sur `http://localhost:3003`, que `*.localhost` ne
  // couvre pas → on l'ajoute explicitement.
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? '';
  const posthogHost = process.env.POSTHOG_HOST ?? '';
  const crispUrl = 'https://*.crisp.chat';
  const sentryOrigin = getSentryOrigin();
  const rootDomain = getRootDomain(url.hostname);

  const cspHeader = `
    default-src 'self';
    img-src 'self' blob: data: ${supabaseUrl} ${crispUrl};
    font-src 'self' data: ${crispUrl};
    media-src 'self' data: ${crispUrl};
    script-src ${scriptSrc} ${posthogHost} ${crispUrl};
    style-src ${styleSrc} ${crispUrl};
    object-src 'none';
    worker-src 'self' blob: ${crispUrl};
    connect-src 'self'
      ${supabaseUrl}
      ${supabaseWsUrl}
      *.${rootDomain}
      ${authUrl}
      ${backendUrl}
      ${posthogHost}
      ${sentryOrigin}
      ${crispUrl}
      wss://*.relay.crisp.chat
      wss://*.relay.rescue.crisp.chat;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src ${crispUrl};
    block-all-mixed-content;
    ${
      /* activé uniquement en prod pour éviter que safari redirige tjrs en https en dev */
      isProd && url.hostname !== 'localhost' ? 'upgrade-insecure-requests;' : ''
    }
  `;

  // supprime les retours à la ligne et les espaces en trop
  return cspHeader.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Origine du serveur Sentry (collecte des erreurs + Session Replay), déduite du
 * DSN. Renvoie une chaîne vide si le DSN est absent ou invalide.
 */
function getSentryOrigin(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return '';
  }
  try {
    return new URL(dsn).origin;
  } catch {
    return '';
  }
}
