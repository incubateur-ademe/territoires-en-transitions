import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// NEXT_PUBLIC_APP_URL est lue dans la branche auth (redirection vers l'app) ;
// elle doit être définie avant l'import du module sous test.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.territoiresentransitions.fr';
});

// Neutralise le guard `server-only` (non disponible en environnement jsdom)
vi.mock('server-only', () => ({}));

// Mocks des dépendances de résolution de session / DCP / collectivités.
vi.mock('@tet/api/utils/supabase/proxy-client', () => ({
  getNextResponseWithUpdatedSupabaseSession: vi.fn(),
}));
vi.mock('@tet/api/users/dcp.fetch', () => ({
  dcpFetch: vi.fn(),
}));
vi.mock('@tet/api/users/user-collectivites.fetch.server', () => ({
  fetchUserCollectivites: vi.fn(),
}));

import { dcpFetch } from '@tet/api/users/dcp.fetch';
import { fetchUserCollectivites } from '@tet/api/users/user-collectivites.fetch.server';
import { getNextResponseWithUpdatedSupabaseSession } from '@tet/api/utils/supabase/proxy-client';
import { proxy } from './proxy';

const mockedGetSession = vi.mocked(getNextResponseWithUpdatedSupabaseSession);
const mockedDcpFetch = vi.mocked(dcpFetch);
const mockedFetchUserCollectivites = vi.mocked(fetchUserCollectivites);

const HOST = 'app.territoiresentransitions.fr';
const APP_URL = 'https://app.territoiresentransitions.fr';

const fakeUser = { sub: 'user-123' };
const fakeDcp = { user_id: 'user-123', prenom: 'Jean', nom: 'Dupont' };

/** Construit une NextRequest avec le bon en-tête host (et origin optionnel). */
function makeRequest(
  pathname: string,
  options: { origin?: string } = {}
): NextRequest {
  const headers: Record<string, string> = { host: HOST };
  if (options.origin) {
    headers.origin = options.origin;
  }
  return new NextRequest(`${APP_URL}${pathname}`, { headers });
}

/**
 * Configure la session renvoyée par getNextResponseWithUpdatedSupabaseSession.
 * Renvoie le `supabaseResponse` (réponse "servir la page") pour assertion.
 */
function mockSession(user: unknown): NextResponse {
  const supabaseResponse = NextResponse.next();
  mockedGetSession.mockResolvedValue({
    supabaseResponse,
    supabaseUser: user as never,
    supabaseClient: {} as never,
  });
  return supabaseResponse;
}

/** Une réponse "servie" : pas de redirection. */
function expectServed(response: NextResponse) {
  expect(response.headers.get('location')).toBeNull();
  expect(response.status).toBe(200);
}

/** Une réponse de redirection vers l'URL donnée (href complet). */
function expectRedirectTo(response: NextResponse, expectedHref: string) {
  expect([307, 308]).toContain(response.status);
  expect(response.headers.get('location')).toBe(expectedHref);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = APP_URL;
});

describe('proxy — branche AUTH (routes (auth) servies en local)', () => {
  it('[1] non authentifié sur /login → sert la page (pas de redirection)', async () => {
    const served = mockSession(undefined);
    const response = await proxy(makeRequest('/login'));
    expect(response).toBe(served);
    expectServed(response);
  });

  it('[1] non authentifié sur /recover → sert la page', async () => {
    mockSession(undefined);
    expectServed(await proxy(makeRequest('/recover')));
  });

  it('[6] authentifié sans DCP sur /signup → sert la page (complétion DCP)', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(null as never);
    expectServed(await proxy(makeRequest('/signup')));
  });

  it('[7] authentifié sans DCP sur /login → redirige /signup?view=etape3 (même origine)', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(null as never);

    const response = await proxy(makeRequest('/login'));
    const location = new URL(response.headers.get('location') as string);

    expect(response.status).toBe(307);
    expect(location.origin).toBe(APP_URL);
    expect(location.pathname).toBe('/signup');
    expect(location.searchParams.get('view')).toBe('etape3');
    // pas de redirect_to ajouté dans ce cas (on conserve la query existante)
    expect(location.searchParams.get('redirect_to')).toBeNull();
  });

  it('[8] authentifié + DCP sur /login → SERT la page (décision produit)', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    expectServed(await proxy(makeRequest('/login')));
  });

  it('[9] authentifié + DCP sur /rejoindre-une-collectivite → sert la page', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    expectServed(await proxy(makeRequest('/rejoindre-une-collectivite')));
  });

  it('[10] authentifié + DCP sur /recover → sert la page', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    expectServed(await proxy(makeRequest('/recover')));
  });

  it('authentifié + DCP sur /invite → sert la page', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    expectServed(await proxy(makeRequest('/invite')));
  });

  it('authentifié + DCP sur /error → sert la page', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    expectServed(await proxy(makeRequest('/error')));
  });

  it('[11] authentifié + DCP sur /signup (sans redirect_to) → redirige vers APP_URL', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    expectRedirectTo(await proxy(makeRequest('/signup')), `${APP_URL}/`);
  });

  it('[12] authentifié + DCP sur /signup?redirect_to=<même root> → redirige vers cette URL', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    const redirectTo = 'https://panier.territoiresentransitions.fr/landing';
    const response = await proxy(
      makeRequest(`/signup?redirect_to=${encodeURIComponent(redirectTo)}`)
    );
    expectRedirectTo(response, redirectTo);
  });

  it('[13] authentifié + DCP sur /signup?redirect_to=<externe> → redirige vers APP_URL (pas l’URL externe)', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    const redirectTo = 'https://evil.example.com/phishing';
    const response = await proxy(
      makeRequest(`/signup?redirect_to=${encodeURIComponent(redirectTo)}`)
    );
    expectRedirectTo(response, `${APP_URL}/`);
  });
});

describe('proxy — branche APP (logique existante)', () => {
  it('[3] non authentifié sur une route protégée → redirige /', async () => {
    mockSession(undefined);
    expectRedirectTo(await proxy(makeRequest('/mon-espace')), `${APP_URL}/`);
  });

  it('[4] non authentifié sur / → sert la page', async () => {
    mockSession(undefined);
    expectServed(await proxy(makeRequest('/')));
  });

  it('[5] authentifié sans DCP sur une route app → redirige /signup?view=etape3&redirect_to=<url> (même origine)', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(null as never);

    const response = await proxy(makeRequest('/mon-espace'));
    const location = new URL(response.headers.get('location') as string);

    expect(response.status).toBe(307);
    expect(location.origin).toBe(APP_URL);
    expect(location.pathname).toBe('/signup');
    expect(location.searchParams.get('view')).toBe('etape3');
    expect(location.searchParams.get('redirect_to')).toBe(
      `${APP_URL}/mon-espace`
    );
  });

  it('[14] authentifié + DCP, 0 collectivité, route non autorisée → redirige finaliser', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    mockedFetchUserCollectivites.mockResolvedValue([] as never);
    expectRedirectTo(
      await proxy(makeRequest('/mon-espace')),
      `${APP_URL}/finaliser-mon-inscription`
    );
  });

  it('[15] authentifié + DCP, avec collectivités, sur / → redirige TDB', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    mockedFetchUserCollectivites.mockResolvedValue([{ collectiviteId: 1 }] as never);
    expectRedirectTo(
      await proxy(makeRequest('/')),
      `${APP_URL}/collectivite/tableau-de-bord`
    );
  });

  it('[16] authentifié + DCP, avec collectivités, sur une route app (!== /) → sert la page', async () => {
    mockSession(fakeUser);
    mockedDcpFetch.mockResolvedValue(fakeDcp as never);
    mockedFetchUserCollectivites.mockResolvedValue([{ collectiviteId: 1 }] as never);
    expectServed(await proxy(makeRequest('/collectivite/1/accueil')));
  });
});

describe('proxy — CORS', () => {
  it('origine autorisée → Access-Control-Allow-Origin présent + en-têtes CORS toujours présents', async () => {
    mockSession(undefined);
    const response = await proxy(
      makeRequest('/', { origin: 'https://panier.territoiresentransitions.fr' })
    );

    // En environnement de test, isAllowedOrigin renvoie true → l'origine est renvoyée.
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://panier.territoiresentransitions.fr'
    );
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET,DELETE,PATCH,POST,PUT,OPTIONS'
    );
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
      'authorization'
    );
  });
});
