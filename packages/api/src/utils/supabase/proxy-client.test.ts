import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getCookieOptions } from './cookie-options';
import { migrateLegacyRootDomainCookies } from './proxy-client';

const requestWithCookies = (cookie: string) =>
  new NextRequest('https://app.territoiresentransitions.fr/', {
    headers: { cookie },
  });

describe('migration du cookie de session vers __Host-', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('sans préfixe __Host-, garde le domaine racine et ne migre rien', () => {
    vi.stubEnv('SUPABASE_AUTH_COOKIE_NAME', 'sb-tet-auth-token');
    vi.stubEnv('COOKIE_DOMAIN', 'app.territoiresentransitions.fr');
    const options = getCookieOptions();

    expect(options.domain).toBe('.territoiresentransitions.fr');
    expect(
      migrateLegacyRootDomainCookies(
        requestWithCookies('sb-tet-auth-token=abc'),
        options
      )
    ).toEqual([]);
  });

  it('recopie les morceaux de l’ancien cookie et le supprime du domaine racine', () => {
    vi.stubEnv('SUPABASE_AUTH_COOKIE_NAME', '__Host-sb-tet-auth-token');
    vi.stubEnv('COOKIE_DOMAIN', 'app.territoiresentransitions.fr');
    const options = getCookieOptions();
    expect(options).toMatchObject({ secure: true, path: '/' });
    expect(options.domain).toBeUndefined();

    const request = requestWithCookies(
      'sb-tet-auth-token.0=aaa; sb-tet-auth-token.1=bbb; autre=1'
    );
    const toSet = migrateLegacyRootDomainCookies(request, options);

    expect(request.cookies.get('__Host-sb-tet-auth-token.1')?.value).toBe(
      'bbb'
    );
    expect(request.cookies.has('sb-tet-auth-token.0')).toBe(false);
    expect(toSet).toContainEqual(
      expect.objectContaining({
        name: 'sb-tet-auth-token.0',
        value: '',
        options: expect.objectContaining({
          domain: '.territoiresentransitions.fr',
          maxAge: 0,
        }),
      })
    );
    const migrated = toSet.find((c) => c.name === '__Host-sb-tet-auth-token.0');
    expect(migrated?.value).toBe('aaa');
    expect(migrated?.options.domain).toBeUndefined();
  });

  it('ne remplace pas une session __Host- existante mais purge l’ancien cookie', () => {
    vi.stubEnv('SUPABASE_AUTH_COOKIE_NAME', '__Host-sb-tet-auth-token');
    const request = requestWithCookies(
      '__Host-sb-tet-auth-token=new; sb-tet-auth-token=old'
    );
    const toSet = migrateLegacyRootDomainCookies(request, getCookieOptions());

    expect(toSet.map((c) => c.name)).toEqual(['sb-tet-auth-token']);
    expect(request.cookies.get('__Host-sb-tet-auth-token')?.value).toBe('new');
  });
});
