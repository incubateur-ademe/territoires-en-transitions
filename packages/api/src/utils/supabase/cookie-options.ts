// Ensure to call this function in the server-side only
// to dynamically get the environment variables from the server
import 'server-only';

import { CookieOptionsWithName } from '@supabase/ssr';
import { getRootDomain } from '../pathUtils';

export function getCookieOptions(
  hostname: string | undefined = process.env.COOKIE_DOMAIN
): CookieOptionsWithName {
  const domain =
    hostname ??
    (process.env.NODE_ENV === 'production'
      ? 'territoiresentransitions.fr'
      : 'localhost');

  const rootDomain = `.${getRootDomain(domain)}`;

  return {
    // name: 'sb-tet-auth-token',
    domain: rootDomain,
    maxAge: 100000000,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}
