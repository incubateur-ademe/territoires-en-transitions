import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Neutralise le guard `server-only` (non disponible en environnement jsdom)
vi.mock('server-only', () => ({}));

// Le proxy ne fait plus que : rafraîchir la session Supabase, poser la CSP/CORS
// et une garde *optimiste* (session absente sur route protégée → /). Toutes les
// décisions dépendantes des données (DCP, collectivités) sont testées au niveau
// de la DAL / des layouts (voir require-onboarded-user, (authed)/layout,
// (public)/page, is-allowed-without-collectivite).
vi.mock('@tet/api/utils/supabase/proxy-client', () => ({
  getNextResponseWithUpdatedSupabaseSession: vi.fn(),
}));

import { getNextResponseWithUpdatedSupabaseSession } from '@tet/api/utils/supabase/proxy-client';
import { proxy } from './proxy';

const mockedGetSession = vi.mocked(getNextResponseWithUpdatedSupabaseSession);

const HOST = 'app.territoiresentransitions.fr';
const APP_URL = 'https://app.territoiresentransitions.fr';

const fakeUser = { sub: 'user-123' };

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
});

describe('proxy — garde optimiste (cookie de session uniquement)', () => {
  it('non authentifié sur une route protégée → redirige /', async () => {
    mockSession(undefined);
    expectRedirectTo(await proxy(makeRequest('/mon-espace')), `${APP_URL}/`);
  });

  it('non authentifié sur / → sert la page', async () => {
    mockSession(undefined);
    expectServed(await proxy(makeRequest('/')));
  });

  it.each(['/login', '/signup', '/recover', '/invite'])(
    'non authentifié sur %s (route d’auth publique) → sert la page',
    async (pathname) => {
      mockSession(undefined);
      expectServed(await proxy(makeRequest(pathname)));
    }
  );

  it('non authentifié sur /invitation/xxx → sert la page', async () => {
    mockSession(undefined);
    expectServed(await proxy(makeRequest('/invitation/abc')));
  });

  it('authentifié sur une route protégée → sert la page (décisions déléguées à la DAL)', async () => {
    const served = mockSession(fakeUser);
    const response = await proxy(makeRequest('/mon-espace'));
    expect(response).toBe(served);
    expectServed(response);
  });

  it('authentifié sur / → sert la page (la redirection TDB est gérée par (public)/page)', async () => {
    mockSession(fakeUser);
    expectServed(await proxy(makeRequest('/')));
  });

  it('authentifié sur /login → sert la page (plus de redirection auth → app)', async () => {
    mockSession(fakeUser);
    expectServed(await proxy(makeRequest('/login')));
  });
});

describe('proxy — en-têtes de sécurité', () => {
  it('pose une Content-Security-Policy sur la réponse servie', async () => {
    mockSession(fakeUser);
    const response = await proxy(makeRequest('/mon-espace'));
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
  });

  it('pose une Content-Security-Policy sur la réponse de redirection', async () => {
    mockSession(undefined);
    const response = await proxy(makeRequest('/mon-espace'));
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
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
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET,DELETE,PATCH,POST,PUT,OPTIONS'
    );
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
      'authorization'
    );
  });
});
