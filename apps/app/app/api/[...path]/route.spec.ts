import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tet/api/environmentVariables', () => ({
  ENV: { backend_url: 'https://api.example.fr/' },
}));

import { POST } from './route';

describe('proxy /api vers le backend', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('relaie chemin, cookies et redirections sans suivre ni changer d’hôte', async () => {
    const backendHeaders = new Headers({
      location: 'https://idp.example.fr/',
      connection: 'x-backend-hop',
      'x-backend-hop': '1',
    });
    backendHeaders.append('set-cookie', 'state=a; Path=/');
    backendHeaders.append('set-cookie', 'nonce=b; Path=/');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: backendHeaders })
      );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      // En `standalone`, l'URL porte l'adresse d'écoute, pas l'hôte public.
      new NextRequest('http://0.0.0.0:3000/api/v1/proconnect/login?x=1', {
        method: 'POST',
        headers: {
          host: 'app.example.fr',
          cookie: 'session=1',
          origin: 'https://app.example.fr',
          connection: 'x-hop, x-forwarded-host',
          'x-hop': '1',
        },
        body: '{}',
      })
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.fr/api/v1/proconnect/login?x=1');
    expect(init.redirect).toBe('manual');
    expect(init.headers.get('cookie')).toBe('session=1');
    expect(init.headers.get('origin')).toBe('https://app.example.fr');
    expect(init.headers.has('host')).toBe(false);
    expect(init.headers.get('x-forwarded-host')).toBe('app.example.fr');
    expect(init.headers.has('x-hop')).toBe(false);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://idp.example.fr/');
    expect(response.headers.has('x-backend-hop')).toBe(false);
    expect(response.headers.getSetCookie()).toEqual([
      'state=a; Path=/',
      'nonce=b; Path=/',
    ]);
  });
});
