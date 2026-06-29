import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getAuthUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('construit une URL basée sur NEXT_PUBLIC_APP_URL', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_APP_URL',
      'https://app.territoiresentransitions.fr'
    );
    vi.resetModules();
    const { getAuthUrl } = await import('./pathUtils');

    const url = getAuthUrl(
      '/login',
      new URLSearchParams({ redirect_to: 'x' })
    );

    expect(url.toString()).toBe(
      'https://app.territoiresentransitions.fr/login?redirect_to=x'
    );
  });

  it('sans search params, pas de point d’interrogation', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_APP_URL',
      'https://app.territoiresentransitions.fr'
    );
    vi.resetModules();
    const { getAuthUrl } = await import('./pathUtils');

    const url = getAuthUrl('/recover', new URLSearchParams());

    expect(url.toString()).toBe(
      'https://app.territoiresentransitions.fr/recover'
    );
  });
});
