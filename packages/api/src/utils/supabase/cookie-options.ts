// Ensure to call this function in the server-side only
// to dynamically get the environment variables from the server
import 'server-only';

import type { CookieOptionsWithName } from '@supabase/ssr';
import { getRootDomain } from '../pathUtils';

export function getCookieOptions(
  hostname: string | undefined = process.env.COOKIE_DOMAIN
): CookieOptionsWithName {
  const isProd =
    process.env.NODE_ENV === 'production' && process.env.ENV_NAME !== 'ci';
  const domain =
    hostname ?? (isProd ? 'territoiresentransitions.fr' : 'localhost');

  const rootDomain = `.${getRootDomain(domain)}`;

  // Nom distinct par environnement : avec GoTrue self-hosté, le nom par défaut
  // (`sb-<1er label de SUPABASE_URL>-auth-token`) est le même partout et les
  // environnements s'écrasent leurs sessions sur le domaine racine.
  // Absent : nom par défaut de @supabase/ssr (prod sur Supabase cloud).
  const name = process.env.SUPABASE_AUTH_COOKIE_NAME;

  return {
    ...(name && { name }),
    domain: rootDomain,
    maxAge: 100000000,
    path: '/',
    sameSite: 'lax',
    secure: isProd,
  };
}
