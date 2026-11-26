// Ensure to call this function in the server-side only
// to dynamically get the environment variables from the server
import 'server-only';

import type { CookieOptionsWithName } from '@supabase/ssr';
import { getRootDomain } from '../pathUtils';

const HOST_ONLY_PREFIX = '__Host-';

function getRootCookieDomain(hostname: string | undefined, isProd: boolean) {
  const domain =
    hostname ?? (isProd ? 'territoiresentransitions.fr' : 'localhost');
  return `.${getRootDomain(domain)}`;
}

function isProdEnv() {
  return process.env.NODE_ENV === 'production' && process.env.ENV_NAME !== 'ci';
}

export function getCookieOptions(
  hostname: string | undefined = process.env.COOKIE_DOMAIN
): CookieOptionsWithName {
  const isProd = isProdEnv();

  // Nom distinct par environnement : avec GoTrue self-hosté, le nom par défaut
  // (`sb-<1er label de SUPABASE_URL>-auth-token`) est le même partout et les
  // environnements s'écrasent leurs sessions sur le domaine racine.
  // Absent : nom par défaut de @supabase/ssr.
  const name = process.env.SUPABASE_AUTH_COOKIE_NAME;

  // Préfixe `__Host-` : cookie limité à l'hôte de l'app (ni `Domain`, ni
  // sous-domaine qui puisse le lire ou l'écraser). Le navigateur exige alors
  // `Secure` et `Path=/`. Suppose que le navigateur joint le backend par
  // l'origine de l'app (`BACKEND_BROWSER_URL`).
  const isHostOnly = name?.startsWith(HOST_ONLY_PREFIX) ?? false;

  return {
    ...(name && { name }),
    ...(!isHostOnly && { domain: getRootCookieDomain(hostname, isProd) }),
    maxAge: 100000000,
    path: '/',
    sameSite: 'lax',
    secure: isProd || isHostOnly,
  };
}

/**
 * Cookie de session d'avant le passage à `__Host-` : même nom sans le préfixe,
 * posé sur le domaine racine. `undefined` si le cookie courant n'est pas
 * limité à l'hôte.
 */
export function getLegacyRootDomainCookie(
  hostname: string | undefined = process.env.COOKIE_DOMAIN
): { name: string; domain: string } | undefined {
  const name = process.env.SUPABASE_AUTH_COOKIE_NAME;
  if (!name?.startsWith(HOST_ONLY_PREFIX)) {
    return undefined;
  }
  return {
    name: name.slice(HOST_ONLY_PREFIX.length),
    domain: getRootCookieDomain(hostname, isProdEnv()),
  };
}
