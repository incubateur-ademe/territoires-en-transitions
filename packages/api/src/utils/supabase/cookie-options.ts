import { CookieOptionsWithName } from '@supabase/ssr';
import { getRootDomain } from '../pathUtils';

export function getCookieOptions(): CookieOptionsWithName {
  console.log('getCookieOptions#COOKIE_DOMAIN', process.env.COOKIE_DOMAIN);

  const domain =
    process.env.COOKIE_DOMAIN ?? process.env.NODE_ENV === 'production'
      ? 'territoiresentransitions.fr'
      : 'localhost';

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
